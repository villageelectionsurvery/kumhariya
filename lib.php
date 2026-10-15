<?php
declare(strict_types=1);

$config = require __DIR__ . '/config.php';
date_default_timezone_set($config['timezone']);

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

function hindi_number(int $n): string
{
    return strtr((string) $n, array_combine(range(0, 9), HINDI_DIGITS));
}

function start_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
        session_start();
    }
}

/*
 * One-time form tokens stop the same filled-in form from being saved twice
 * (double clicks, browser resubmits). They do not stop one person from taking
 * the survey more than once.
 */
function issue_form_token(): string
{
    start_session();
    $token = bin2hex(random_bytes(16));
    $tokens = $_SESSION['form_tokens'] ?? [];
    $tokens[$token] = time();
    // keep the session small: only the 20 most recent open forms
    $_SESSION['form_tokens'] = array_slice($tokens, -20, null, true);
    return $token;
}

function consume_form_token(string $token): bool
{
    start_session();
    if ($token === '' || !isset($_SESSION['form_tokens'][$token])) {
        return false;
    }
    unset($_SESSION['form_tokens'][$token]);
    return true;
}

/*
 * Device lock: each browser gets a random ID in a long-lived cookie, and only a
 * keyed hash of it is saved with the response. A device that has submitted is
 * shown a "already submitted" screen instead of the form. Clearing cookies or
 * using another browser or phone gets around it, so this limits casual repeat
 * submissions; it cannot guarantee one response per person.
 */
const DEVICE_COOKIE = 'kum_device';

function device_id(): string
{
    $id = $_COOKIE[DEVICE_COOKIE] ?? '';
    if (is_string($id) && preg_match('/^[a-f0-9]{32}$/', $id)) {
        return $id;
    }
    $id = bin2hex(random_bytes(16));
    setcookie(DEVICE_COOKIE, $id, [
        'expires' => time() + 5 * 365 * 24 * 3600,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => ($_SERVER['HTTPS'] ?? '') === 'on',
    ]);
    $_COOKIE[DEVICE_COOKIE] = $id;
    return $id;
}

/** Hash stored instead of the raw cookie value, keyed with a per-site secret. */
function device_hash(array $config, string $deviceId): string
{
    $keyFile = dirname($config['data_file']) . '/device.key';
    $key = is_file($keyFile) ? trim((string) file_get_contents($keyFile)) : '';
    if ($key === '') {
        $key = bin2hex(random_bytes(32));
        if (!is_dir(dirname($keyFile))) {
            mkdir(dirname($keyFile), 0775, true);
        }
        // only the first writer's key is kept if two requests race here
        if (@file_put_contents($keyFile, $key, LOCK_EX) === false) {
            throw new StoreException('no_device_key');
        }
        $key = trim((string) file_get_contents($keyFile));
    }
    return hash_hmac('sha256', $deviceId, $key);
}

/* Collapse whitespace and normalise Unicode so the same name typed twice
   is counted as one candidate. */
function normalize_name(string $name): string
{
    $name = trim(preg_replace('/\s+/u', ' ', $name) ?? '');
    if (class_exists('Normalizer')) {
        $name = Normalizer::normalize($name, Normalizer::FORM_C) ?: $name;
    }
    return $name;
}

final class StoreException extends RuntimeException {}

/*
 * leads.json access. Every read and write holds a lock on a separate lock file;
 * writes go to a temp file that is renamed over leads.json, so a failed write
 * never leaves a half-written file behind.
 */
final class SurveyStore
{
    public function __construct(private string $file, private string $title) {}

    /** @return array{survey:string,responses:array} */
    public function read(): array
    {
        return $this->withLock(LOCK_SH, fn() => $this->load());
    }

    /** Throws StoreException('device_used') if this device already submitted. */
    public function append(array $response): void
    {
        $this->withLock(LOCK_EX, function () use ($response) {
            $data = $this->load();
            if (isset($response['device_hash']) && self::hasDevice($data['responses'], $response['device_hash'])) {
                throw new StoreException('device_used');
            }
            $data['responses'][] = $response;
            $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
            $tmp = $this->file . '.tmp';
            if (file_put_contents($tmp, $json . "\n") === false || !rename($tmp, $this->file)) {
                @unlink($tmp);
                throw new StoreException('write_failed');
            }
        });
    }

    public function deviceHasSubmitted(string $deviceHash): bool
    {
        return $this->withLock(LOCK_SH, fn() => self::hasDevice($this->load()['responses'], $deviceHash));
    }

    private static function hasDevice(array $responses, string $deviceHash): bool
    {
        foreach ($responses as $r) {
            if (($r['device_hash'] ?? null) === $deviceHash) {
                return true;
            }
        }
        return false;
    }

    private function load(): array
    {
        if (!is_file($this->file)) {
            return ['survey' => $this->title, 'responses' => []];
        }
        $raw = file_get_contents($this->file);
        if ($raw === false) {
            throw new StoreException('read_failed');
        }
        if (trim($raw) === '') {
            return ['survey' => $this->title, 'responses' => []];
        }
        try {
            $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            // Never overwrite a damaged file: an admin must repair it first.
            throw new StoreException('invalid_json');
        }
        if (!is_array($data) || !isset($data['responses']) || !is_array($data['responses'])) {
            throw new StoreException('invalid_json');
        }
        return $data;
    }

    private function withLock(int $mode, callable $fn): mixed
    {
        $dir = dirname($this->file);
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new StoreException('no_data_dir');
        }
        $lock = fopen($this->file . '.lock', 'c');
        if ($lock === false || !flock($lock, $mode)) {
            throw new StoreException('lock_failed');
        }
        try {
            return $fn();
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}

function survey_store(array $config): SurveyStore
{
    return new SurveyStore($config['data_file'], $config['survey_title']);
}

function independent_party(array $config): ?array
{
    foreach ($config['parties'] as $p) {
        if (!empty($p['independent'])) {
            return $p;
        }
    }
    return null;
}

/*
 * Validates a submitted form against the configuration.
 * Returns [selections, errors]; selections are keyed by post label as stored
 * in leads.json.
 */
function validate_submission(array $input, array $config): array
{
    $selections = [];
    $errors = [];
    $partiesById = array_column($config['parties'], null, 'id');

    foreach ($config['posts'] as $post) {
        $choice = $input['choice'][$post['id']] ?? '';
        if (!is_string($choice) || !isset($partiesById[$choice])) {
            $errors[$post['id']] = $post['label'] . ' पद के लिए अपनी पसंद चुनें।';
            continue;
        }
        $party = $partiesById[$choice];
        $candidate = null;
        if (!empty($party['independent'])) {
            $raw = $input['candidate'][$post['id']] ?? '';
            $candidate = is_string($raw) ? normalize_name($raw) : '';
            $len = mb_strlen($candidate);
            if ($len < 2 || $len > 60 || !preg_match("/^[\p{L}\p{M}\s.'-]+$/u", $candidate)) {
                $errors[$post['id']] = $post['label'] . ' पद के निर्दलीय उम्मीदवार का सही नाम लिखें (2–60 अक्षर)।';
                continue;
            }
        }
        $selections[$post['label']] = ['party' => $party['label'], 'candidate_name' => $candidate];
    }

    return [$selections, $errors];
}

/*
 * Per-post statistics for the results page. Percentages use the number of
 * responses that answered that post as the base and are rounded to 2 places.
 */
function survey_stats(array $responses, array $config): array
{
    $pct = fn(int $count, int $total): float => $total > 0 ? round($count * 100 / $total, 2) : 0.0;
    $independentLabel = independent_party($config)['label'] ?? null;
    $posts = [];

    foreach ($config['posts'] as $post) {
        $partyCounts = array_fill_keys(array_column($config['parties'], 'label'), 0);
        $candidates = []; // lowercase key => [display name, count]
        $total = 0;

        foreach ($responses as $r) {
            $sel = $r['selections'][$post['label']] ?? null;
            if (!is_array($sel) || !isset($partyCounts[$sel['party'] ?? ''])) {
                continue;
            }
            $total++;
            $partyCounts[$sel['party']]++;
            if ($sel['party'] === $independentLabel && !empty($sel['candidate_name'])) {
                $name = normalize_name((string) $sel['candidate_name']);
                $key = mb_strtolower($name);
                $candidates[$key] ??= ['name' => $name, 'count' => 0];
                $candidates[$key]['count']++;
            }
        }

        $parties = [];
        foreach ($config['parties'] as $p) {
            $c = $partyCounts[$p['label']];
            $parties[] = [
                'label' => $p['label'],
                'color' => $p['color'],
                'independent' => !empty($p['independent']),
                'count' => $c,
                'percent' => $pct($c, $total),
            ];
        }
        $candidateList = array_values($candidates);
        usort($candidateList, fn($a, $b) => $b['count'] <=> $a['count'] ?: strcmp($a['name'], $b['name']));
        foreach ($candidateList as &$cand) {
            $cand['percent'] = $pct($cand['count'], $total);
        }
        unset($cand);

        $posts[] = [
            'id' => $post['id'],
            'label' => $post['label'],
            'title' => $post['title'],
            'total' => $total,
            'parties' => $parties,
            'candidates' => $candidateList,
        ];
    }

    return ['total_responses' => count($responses), 'posts' => $posts];
}
