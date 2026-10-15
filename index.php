<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

$pageTitle = $config['survey_title'];
$activePage = 'survey';
$pageScripts = ['assets/js/survey.js'];

$deviceId = device_id(); // sets the device cookie before any output
start_session();
$flash = $_SESSION['flash'] ?? null; // set by submit_survey.php for non-JS submissions
unset($_SESSION['flash']);
$old = $flash['old'] ?? [];
$errors = $flash['errors'] ?? [];
$submitted = ($flash['status'] ?? '') === 'success';
try {
    $deviceLocked = survey_store($config)->deviceHasSubmitted(device_hash($config, $deviceId));
} catch (StoreException) {
    $deviceLocked = false; // a storage problem is reported when they submit
}
// Right after their own submission they see the thank-you message instead.
$showLocked = $deviceLocked && !$submitted;
$token = issue_form_token();
$letters = ['क', 'ख', 'ग', 'घ', 'ङ', 'च'];

require __DIR__ . '/partials/header.php';
?>
<section class="hero mb-4">
  <img src="assets/img/hero.jpg" alt="ग्राम पंचायत कुम्हारिया का ग्रामीण दृश्य" class="hero-img">
  <div class="hero-content">
    <h1><?= e($config['survey_title']) ?></h1>
    <p>गाँव के चुनाव को लेकर आपकी पसंद क्या है? अपना मत सर्वेक्षण में दर्ज करें।</p>
  </div>
</section>

<div id="success-panel" class="civic-card success-panel text-center p-4 p-md-5 mb-4 <?= $submitted ? '' : 'd-none' ?>" role="status" tabindex="-1">
  <span class="material-symbols-outlined success-icon">check_circle</span>
  <h2 class="h4 mt-2">आपकी सर्वे प्रतिक्रिया सफलतापूर्वक दर्ज हो गई है। धन्यवाद!</h2>
  <p class="text-muted mb-3">एक डिवाइस से केवल एक बार प्रतिक्रिया दी जा सकती है; अब इसे बदला नहीं जा सकता।</p>
  <a href="results.php" class="btn btn-outline-civic">सर्वे परिणाम देखें</a>
</div>

<div id="locked-panel" class="civic-card locked-panel text-center p-4 p-md-5 mb-4 <?= $showLocked ? '' : 'd-none' ?>" role="status">
  <span class="material-symbols-outlined locked-icon">verified</span>
  <h2 class="h4 mt-2">इस डिवाइस से आपकी सर्वे प्रतिक्रिया पहले ही दर्ज हो चुकी है।</h2>
  <p class="text-muted mb-3">एक डिवाइस से केवल एक बार प्रतिक्रिया दी जा सकती है, और जमा करने के बाद उसे बदला नहीं जा सकता। धन्यवाद!</p>
  <a href="results.php" class="btn btn-outline-civic">सर्वे परिणाम देखें</a>
</div>

<div id="survey-area" class="<?= $submitted || $deviceLocked ? 'd-none' : '' ?>">
  <div class="civic-card notice-card d-flex align-items-start gap-3 p-3 mb-4">
    <span class="material-symbols-outlined text-secondary-civic">how_to_vote</span>
    <div class="flex-grow-1">
      <div class="fw-semibold">अपनी जनमत राय दर्ज करें</div>
      <div class="small text-muted">यह केवल एक जनमत सर्वेक्षण है, आधिकारिक मतदान नहीं।</div>
    </div>
    <span class="pill pill-neutral d-none d-md-inline-flex"><span class="material-symbols-outlined">lock</span> स्वतंत्र एवं निष्पक्ष सर्वेक्षण</span>
  </div>

  <?php if (!empty($errors['_form'])): ?>
    <div class="alert alert-danger"><?= e($errors['_form']) ?></div>
  <?php endif; ?>
  <div id="form-error" class="alert alert-danger d-none" role="alert"></div>

  <form id="survey-form" action="submit_survey.php" method="post" novalidate>
    <input type="hidden" name="form_token" value="<?= e($token) ?>">
    <div class="row g-4">
      <div class="col-lg-8">
        <?php foreach ($config['posts'] as $i => $post):
            $pid = $post['id'];
            $chosen = $old['choice'][$pid] ?? '';
        ?>
        <fieldset class="civic-card post-card p-3 p-md-4 mb-4" data-post="<?= e($pid) ?>" data-label="<?= e($post['label']) ?>">
          <legend class="d-flex align-items-center justify-content-between gap-2 w-100 mb-3">
            <span class="d-flex align-items-center gap-3">
              <span class="num-badge"><?= hindi_number($i + 1) ?></span>
              <span>
                <span class="post-tag"><?= e($post['tag']) ?></span>
                <span class="post-title d-block"><?= e($post['title']) ?></span>
              </span>
            </span>
            <span class="pill pill-pending status-pill"><span class="material-symbols-outlined">radio_button_unchecked</span><span class="status-text">अपूर्ण</span></span>
          </legend>
          <p class="question mb-3">प्रश्न <?= $i + 1 ?>: <?= e($post['label']) ?> पद के लिए आपकी पसंद कौन है?</p>
          <div class="row g-3">
            <?php foreach ($config['parties'] as $j => $party):
                $inputId = "{$pid}_{$party['id']}";
            ?>
            <div class="col-md-4">
              <label class="choice-card" for="<?= e($inputId) ?>">
                <span class="d-flex justify-content-between align-items-start">
                  <span class="letter-badge"><?= $letters[$j] ?? '' ?></span>
                  <input class="form-check-input choice-input" type="radio" id="<?= e($inputId) ?>" name="choice[<?= e($pid) ?>]"
                         value="<?= e($party['id']) ?>" data-party-label="<?= e($party['label']) ?>"
                         <?= !empty($party['independent']) ? 'data-independent="1"' : '' ?>
                         <?= $chosen === $party['id'] ? 'checked' : '' ?> required>
                </span>
                <span class="choice-name"><span class="material-symbols-outlined"><?= e($party['icon']) ?></span><?= e($party['label']) ?></span>
                <span class="choice-hint"><?= e($party['hint']) ?></span>
              </label>
            </div>
            <?php endforeach; ?>
          </div>
          <div class="candidate-box mt-3 <?= independent_party($config) && $chosen === independent_party($config)['id'] ? '' : 'd-none' ?>">
            <label class="form-label fw-semibold" for="candidate_<?= e($pid) ?>">निर्दलीय उम्मीदवार का नाम लिखें</label>
            <input type="text" class="form-control form-control-lg" id="candidate_<?= e($pid) ?>"
                   name="candidate[<?= e($pid) ?>]" maxlength="60" autocomplete="off"
                   value="<?= e($old['candidate'][$pid] ?? '') ?>" placeholder="उदा. रामलाल">
          </div>
          <div class="invalid-msg text-danger small mt-2 <?= isset($errors[$pid]) ? '' : 'd-none' ?>"><?= e($errors[$pid] ?? '') ?></div>
        </fieldset>
        <?php endforeach; ?>

        <?php if ($config['optional_fields']['name'] || $config['optional_fields']['phone']): ?>
        <div class="civic-card p-3 p-md-4 mb-4">
          <div class="fw-semibold mb-1">आपकी जानकारी (वैकल्पिक)</div>
          <p class="small text-muted">ये जानकारी देना ज़रूरी नहीं है।</p>
          <div class="row g-3">
            <?php if ($config['optional_fields']['name']): ?>
            <div class="col-md-6">
              <label class="form-label" for="resp_name">नाम</label>
              <input type="text" class="form-control" id="resp_name" name="respondent_name" maxlength="60" value="<?= e($old['respondent_name'] ?? '') ?>">
            </div>
            <?php endif; ?>
            <?php if ($config['optional_fields']['phone']): ?>
            <div class="col-md-6">
              <label class="form-label" for="resp_phone">मोबाइल नंबर</label>
              <input type="tel" class="form-control" id="resp_phone" name="respondent_phone" maxlength="15" value="<?= e($old['respondent_phone'] ?? '') ?>">
            </div>
            <?php endif; ?>
          </div>
          <?php if (isset($errors['_respondent'])): ?><div class="text-danger small mt-2"><?= e($errors['_respondent']) ?></div><?php endif; ?>
        </div>
        <?php endif; ?>

        <div class="civic-card privacy-card p-3 p-md-4 mb-4">
          <div class="d-flex gap-2 align-items-start">
            <span class="material-symbols-outlined">info</span>
            <div>
              <div class="fw-semibold mb-1">गोपनीयता सूचना</div>
              <ul class="small mb-0 ps-3">
                <li>हम केवल आपके द्वारा चुनी गई पसंद (पार्टी या निर्दलीय उम्मीदवार का नाम) और जमा करने का समय दर्ज करते हैं।</li>
                <?php if ($config['optional_fields']['name'] || $config['optional_fields']['phone']): ?>
                <li>नाम/मोबाइल नंबर वैकल्पिक है; दिया जाए तो केवल इस सर्वेक्षण के लिए रखा जाता है।</li>
                <?php else: ?>
                <li>आपका नाम, मोबाइल नंबर या पता नहीं माँगा जाता और न ही सहेजा जाता है।</li>
                <?php endif; ?>
                <li>प्रतिक्रियाएँ केवल कुल आँकड़ों के रूप में दिखाई जाती हैं; किसी व्यक्ति की पसंद अलग से प्रकाशित नहीं होती।</li>
                <li>एक डिवाइस से केवल एक बार प्रतिक्रिया दी जा सकती है। इसके लिए आपके ब्राउज़र में एक रैंडम पहचान-कोड (कुकी) रखा जाता है, जिससे आपकी व्यक्तिगत पहचान नहीं होती।</li>
                <li>जमा करने के बाद प्रतिक्रिया बदली नहीं जा सकती।</li>
                <li>यह व्यवस्था पूरी तरह यह सुनिश्चित नहीं कर सकती कि हर व्यक्ति केवल एक बार ही भाग ले (जैसे कोई दूसरा फ़ोन या ब्राउज़र इस्तेमाल करे)।</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <aside class="civic-card summary-card p-3 p-md-4 sticky-lg-top">
          <div class="d-flex gap-2 align-items-center mb-2">
            <span class="material-symbols-outlined text-secondary-civic">assignment_turned_in</span>
            <span class="fw-semibold">आपकी पसंद की समीक्षा</span>
          </div>
          <p class="small text-muted">जमा करने से पहले अपनी पसंद जाँच लें।</p>
          <div class="progress-line mb-3"><span id="progress-bar"></span></div>
          <div class="small mb-3">प्रगति: <strong id="progress-count">0</strong> / <?= count($config['posts']) ?> पद चयनित</div>
          <ul class="summary-list list-unstyled mb-3">
            <?php foreach ($config['posts'] as $post): ?>
            <li data-summary="<?= e($post['id']) ?>">
              <span class="small text-muted d-block"><?= e($post['label']) ?></span>
              <span class="summary-value">— चयन प्रतीक्षारत —</span>
            </li>
            <?php endforeach; ?>
          </ul>
          <button type="submit" class="btn btn-civic w-100" id="review-btn">
            <span class="material-symbols-outlined">fact_check</span> पसंद की पुष्टि करें और जमा करें
          </button>
        </aside>
      </div>
    </div>
  </form>
</div>

<!-- Confirmation dialog -->
<div class="modal fade" id="confirm-modal" tabindex="-1" aria-labelledby="confirm-title" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title h5" id="confirm-title">अपनी पसंद की पुष्टि करें</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="बंद करें"></button>
      </div>
      <div class="modal-body">
        <p class="small text-muted">कृपया जाँच लें। जमा करने के बाद प्रतिक्रिया बदली नहीं जा सकती।</p>
        <ul class="list-unstyled confirm-list mb-0" id="confirm-list"></ul>
      </div>
      <div class="modal-footer d-grid gap-2">
        <button type="button" class="btn btn-civic" id="confirm-submit">
          <span class="material-symbols-outlined">send</span> हाँ, सर्वे जमा करें
        </button>
        <button type="button" class="btn btn-outline-civic" data-bs-dismiss="modal">वापस जाएँ और बदलें</button>
      </div>
    </div>
  </div>
</div>
<?php require __DIR__ . '/partials/footer.php'; ?>
