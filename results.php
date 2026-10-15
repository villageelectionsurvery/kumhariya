<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

$pageTitle = 'सर्वे परिणाम';
$activePage = 'results';
$pageScripts = ['https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', 'assets/js/results.js'];

$loadError = null;
try {
    $responses = survey_store($config)->read()['responses'];
} catch (StoreException $ex) {
    error_log('[survey] could not read responses: ' . $ex->getMessage());
    $responses = [];
    $loadError = $ex->getMessage() === 'invalid_json'
        ? 'सर्वे डेटा फ़ाइल (leads.json) खराब हो गई है। व्यवस्थापक को इसे ठीक करना होगा; तब तक परिणाम नहीं दिखाए जा सकते।'
        : 'सर्वे डेटा पढ़ा नहीं जा सका। कृपया बाद में प्रयास करें।';
}
$stats = survey_stats($responses, $config);
$fmt = fn(float $p): string => number_format($p, 2) . '%';

require __DIR__ . '/partials/header.php';
?>
<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-2 mb-3">
  <div>
    <h1 class="page-title mb-1">सर्वे परिणाम एवं विश्लेषण</h1>
    <p class="text-muted mb-0"><?= e($config['survey_title']) ?></p>
  </div>
  <span class="pill pill-neutral"><span class="material-symbols-outlined">schedule</span> अद्यतन: <?= e(date('d-m-Y, h:i A')) ?></span>
</div>

<div class="alert disclaimer d-flex gap-2 align-items-start mb-4" role="note">
  <span class="material-symbols-outlined">info</span>
  <div>ये आँकड़े केवल सर्वेक्षण में प्राप्त प्रतिक्रियाओं पर आधारित हैं और आधिकारिक चुनाव परिणाम नहीं हैं। एक व्यक्ति द्वारा एक से अधिक बार भाग लेने को पूरी तरह रोका नहीं जा सकता।</div>
</div>

<?php if ($loadError): ?>
  <div class="alert alert-danger"><?= e($loadError) ?></div>
<?php endif; ?>

<section class="row g-3 mb-4">
  <div class="col-6 col-lg-3">
    <div class="civic-card stat-card p-3 h-100">
      <div class="stat-label">कुल सर्वे प्रतिक्रियाएँ</div>
      <div class="stat-value"><?= number_format($stats['total_responses']) ?></div>
    </div>
  </div>
  <?php foreach ($stats['posts'] as $post):
      $lead = null;
      foreach ($post['parties'] as $p) {
          if ($p['count'] > 0 && ($lead === null || $p['count'] > $lead['count'])) $lead = $p;
      }
  ?>
  <div class="col-6 col-lg-3">
    <a class="civic-card stat-card p-3 h-100 d-block text-decoration-none" href="#post-<?= e($post['id']) ?>">
      <div class="stat-label"><?= e($post['label']) ?> पद की पसंद</div>
      <?php if ($lead): ?>
        <div class="stat-value" style="color: <?= e($lead['color']) ?>"><?= e($lead['label']) ?></div>
        <div class="small text-muted"><?= $fmt($lead['percent']) ?> • <?= number_format($post['total']) ?> प्रतिक्रियाएँ</div>
      <?php else: ?>
        <div class="stat-value text-muted">—</div>
        <div class="small text-muted">अभी कोई प्रतिक्रिया नहीं</div>
      <?php endif; ?>
    </a>
  </div>
  <?php endforeach; ?>
</section>

<?php foreach ($stats['posts'] as $i => $post): ?>
<section class="civic-card p-3 p-md-4 mb-4 result-section" id="post-<?= e($post['id']) ?>">
  <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
    <div class="d-flex align-items-center gap-3">
      <span class="num-badge"><?= hindi_number($i + 1) ?></span>
      <h2 class="post-title mb-0"><?= e($post['title']) ?></h2>
    </div>
    <span class="pill pill-neutral">कुल: <?= number_format($post['total']) ?></span>
  </div>

  <div class="row g-3 mb-3">
    <?php foreach ($post['parties'] as $p): ?>
    <div class="col-md-4">
      <div class="party-tile p-3 h-100" style="--party: <?= e($p['color']) ?>">
        <div class="d-flex justify-content-between align-items-baseline">
          <span class="fw-semibold"><?= e($p['label']) ?></span>
          <span class="party-pct"><?= $fmt($p['percent']) ?></span>
        </div>
        <div class="progress-line my-2"><span style="width: <?= $p['percent'] ?>%"></span></div>
        <div class="small text-muted"><?= number_format($p['count']) ?> प्रतिक्रियाएँ</div>
      </div>
    </div>
    <?php endforeach; ?>
  </div>

  <div class="row g-4 align-items-start">
    <div class="col-lg-4">
      <h3 class="chart-title">पार्टी अनुसार पसंद</h3>
      <div class="chart-box chart-doughnut"><canvas id="doughnut-<?= e($post['id']) ?>" role="img" aria-label="<?= e($post['label']) ?> — पार्टी अनुसार पसंद"></canvas></div>
    </div>
    <div class="col-lg-8">
      <h3 class="chart-title">उम्मीदवार/पार्टी तुलना</h3>
      <div class="chart-box chart-bar" style="height: <?= max(220, 56 * (2 + count($post['candidates']))) ?>px"><canvas id="bar-<?= e($post['id']) ?>" role="img" aria-label="<?= e($post['label']) ?> — उम्मीदवार तुलना"></canvas></div>
    </div>
  </div>

  <h3 class="chart-title mt-4">निर्दलीय उम्मीदवार</h3>
  <?php if ($post['candidates']): ?>
  <div class="table-responsive">
    <table class="table table-sm align-middle mb-0">
      <thead><tr><th>उम्मीदवार का नाम</th><th class="text-end">प्रतिक्रियाएँ</th><th class="text-end">प्रतिशत</th></tr></thead>
      <tbody>
      <?php foreach ($post['candidates'] as $c): ?>
        <tr><td><?= e($c['name']) ?></td><td class="text-end"><?= number_format($c['count']) ?></td><td class="text-end"><?= $fmt($c['percent']) ?></td></tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php else: ?>
  <p class="small text-muted mb-0">इस पद के लिए अभी किसी निर्दलीय उम्मीदवार का नाम नहीं आया है।</p>
  <?php endif; ?>
</section>
<?php endforeach; ?>

<p class="small text-muted">प्रतिशत = (उस विकल्प की प्रतिक्रियाएँ ÷ उस पद की कुल मान्य प्रतिक्रियाएँ) × 100, दो दशमलव तक।</p>

<script id="survey-stats" type="application/json"><?= json_encode($stats, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?></script>
<?php require __DIR__ . '/partials/footer.php'; ?>
