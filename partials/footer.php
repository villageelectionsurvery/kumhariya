<?php /** @var array $config */ ?>
</main>
<footer class="site-footer">
  <div class="container-xl py-4 d-flex flex-column flex-md-row justify-content-between gap-3">
    <div class="d-flex align-items-center gap-2">
      <span class="brand-seal small-seal"><span class="material-symbols-outlined">shield</span></span>
      <div>
        <div class="fw-semibold">ग्राम जनमत सर्वेक्षण एवं सामुदायिक संवाद मंच</div>
        <div class="text-muted small"><?= e($config['village']) ?> — स्वतंत्र, गैर-सरकारी सर्वेक्षण</div>
      </div>
    </div>
    <div class="text-muted small align-self-md-center">
      © <?= date('Y') ?> <?= e($config['survey_title']) ?>। यह आधिकारिक चुनाव या राज्य निर्वाचन आयोग का मतदान नहीं है।
    </div>
  </div>
</footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<?php foreach ($pageScripts ?? [] as $src): ?>
<script src="<?= e($src) ?>"></script>
<?php endforeach; ?>
</body>
</html>
