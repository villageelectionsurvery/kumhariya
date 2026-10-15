<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

// The survey page submits with fetch and expects JSON; a browser without
// JavaScript posts the form normally and gets redirected back.
$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function respond(bool $wantsJson, int $status, array $body, array $old = []): never
{
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($body, JSON_UNESCAPED_UNICODE);
        exit;
    }
    start_session();
    $_SESSION['flash'] = $body['ok']
        ? ['status' => 'success']
        : ['status' => ($body['code'] ?? '') === 'device_used' ? 'device_used' : 'error',
           'errors' => $body['errors'] ?? ['_form' => $body['message']], 'old' => $old];
    header('Location: index.php', true, 303);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond($wantsJson, 405, ['ok' => false, 'message' => 'अमान्य अनुरोध।']);
}

$input = $_POST;
$old = [
    'choice' => is_array($input['choice'] ?? null) ? $input['choice'] : [],
    'candidate' => is_array($input['candidate'] ?? null) ? $input['candidate'] : [],
];

const DEVICE_USED_MESSAGE = 'इस डिवाइस से सर्वेक्षण पहले ही जमा किया जा चुका है। एक डिवाइस से केवल एक बार प्रतिक्रिया दी जा सकती है।';

// The device cookie is set when the survey page loads; without it the
// one-response-per-device check cannot work.
$deviceId = $_COOKIE[DEVICE_COOKIE] ?? '';
if (!is_string($deviceId) || !preg_match('/^[a-f0-9]{32}$/', $deviceId)) {
    respond($wantsJson, 400, [
        'ok' => false,
        'message' => 'कृपया ब्राउज़र में कुकीज़ (cookies) चालू करें और पेज रीफ़्रेश करके दोबारा प्रयास करें।',
    ], $old);
}

// One-time token: a repeated submission of the same form is rejected.
if (!consume_form_token((string) ($input['form_token'] ?? ''))) {
    respond($wantsJson, 409, [
        'ok' => false,
        'code' => 'duplicate',
        'message' => 'यह फ़ॉर्म पहले ही जमा हो चुका है या पुराना हो गया है। पेज रीफ़्रेश करके दोबारा प्रयास करें।',
    ], $old);
}

[$selections, $errors] = validate_submission($input, $config);

$respondent = [];
if ($config['optional_fields']['name']) {
    $name = normalize_name((string) ($input['respondent_name'] ?? ''));
    if ($name !== '') {
        if (mb_strlen($name) > 60 || !preg_match("/^[\p{L}\p{M}\s.'-]+$/u", $name)) {
            $errors['_respondent'] = 'नाम में केवल अक्षर लिखें (अधिकतम 60)।';
        } else {
            $respondent['name'] = $name;
        }
    }
}
if ($config['optional_fields']['phone']) {
    $phone = preg_replace('/[\s-]/', '', (string) ($input['respondent_phone'] ?? ''));
    if ($phone !== '') {
        if (!preg_match('/^\+?[0-9]{10,13}$/', $phone)) {
            $errors['_respondent'] = 'सही मोबाइल नंबर लिखें।';
        } else {
            $respondent['phone'] = $phone;
        }
    }
}

if ($errors) {
    // Give the respondent a fresh token so they can correct and resubmit.
    respond($wantsJson, 422, [
        'ok' => false,
        'errors' => $errors,
        'message' => 'कृपया सभी प्रश्नों के उत्तर सही से भरें।',
        'form_token' => issue_form_token(),
    ], $old + [
        'respondent_name' => $input['respondent_name'] ?? '',
        'respondent_phone' => $input['respondent_phone'] ?? '',
    ]);
}

try {
    $deviceHash = device_hash($config, $deviceId);
} catch (StoreException $ex) {
    error_log('[survey] device key unavailable: ' . $ex->getMessage());
    respond($wantsJson, 500, ['ok' => false, 'message' => 'तकनीकी कारण से प्रतिक्रिया सहेजी नहीं जा सकी। कृपया थोड़ी देर बाद प्रयास करें।'], $old);
}

$response = [
    'response_id' => sprintf('%s-%s', date('Ymd'), bin2hex(random_bytes(8))),
    'submitted_at' => date('c'),
    'selections' => $selections,
    'device_hash' => $deviceHash,
];
if ($respondent) {
    $response['respondent'] = $respondent;
}

try {
    survey_store($config)->append($response);
} catch (StoreException $ex) {
    if ($ex->getMessage() === 'device_used') {
        respond($wantsJson, 409, ['ok' => false, 'code' => 'device_used', 'message' => DEVICE_USED_MESSAGE]);
    }
    error_log('[survey] could not save response: ' . $ex->getMessage());
    respond($wantsJson, 500, [
        'ok' => false,
        'message' => 'तकनीकी कारण से प्रतिक्रिया सहेजी नहीं जा सकी। कृपया थोड़ी देर बाद प्रयास करें।',
        'form_token' => issue_form_token(),
    ], $old);
} catch (JsonException $ex) {
    error_log('[survey] could not save response: ' . $ex->getMessage());
    respond($wantsJson, 500, [
        'ok' => false,
        'message' => 'तकनीकी कारण से प्रतिक्रिया सहेजी नहीं जा सकी। कृपया थोड़ी देर बाद प्रयास करें।',
        'form_token' => issue_form_token(),
    ], $old);
}

respond($wantsJson, 200, [
    'ok' => true,
    'message' => 'आपकी सर्वे प्रतिक्रिया सफलतापूर्वक दर्ज हो गई है। धन्यवाद!',
]);
