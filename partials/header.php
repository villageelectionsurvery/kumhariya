<?php
/** @var array $config @var string $pageTitle */
?>
<!doctype html>
<html lang="hi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($pageTitle) ?> — <?= e($config['village']) ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0&display=block" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="assets/css/style.css" rel="stylesheet">
</head>
<body>
<header class="site-header sticky-top">
  <div class="tricolor-bar"><span></span><span></span><span></span></div>
  <div class="header-row container-xl d-flex align-items-center justify-content-between gap-3">
    <a class="brand d-flex align-items-center gap-3 text-decoration-none" href="index.php">
      <span class="brand-seal"><span class="material-symbols-outlined">account_balance</span></span>
      <span class="d-flex flex-column">
        <span class="brand-title"><?= e($config['village']) ?></span>
        <span class="brand-sub d-none d-sm-block">ग्राम जनमत मंच • स्वतंत्र नागरिक विचार एवं ओपिनियन पोल</span>
      </span>
    </a>
    <?php if (!empty($config['helpline'])): ?>
    <a class="helpline d-none d-lg-flex align-items-center gap-2 text-decoration-none"
       href="tel:<?= e(preg_replace('/[^0-9+]/', '', $config['helpline'])) ?>">
      <span class="material-symbols-outlined">call</span>
      <span class="d-flex flex-column">
        <span class="helpline-label">नागरिक सहायता</span>
        <span class="helpline-number"><?= e($config['helpline']) ?></span>
      </span>
    </a>
    <?php endif; ?>
  </div>
</header>
<div class="status-strip">
  <div class="container-xl d-flex flex-column flex-md-row align-items-center justify-content-between gap-1">
    <span class="d-flex align-items-center gap-2">
      <span class="live-dot" aria-hidden="true"></span>
      अनौपचारिक ग्राम जनमत सर्वेक्षण <?= date('Y') ?> • स्वतंत्र सामुदायिक राय
    </span>
    <span class="d-flex align-items-center gap-3">
      <span class="pill pill-live"><span class="material-symbols-outlined">poll</span> सर्वेक्षण सक्रिय है (Poll is Live)</span>
      <span class="strip-muted d-none d-sm-inline-flex align-items-center gap-1"><span class="material-symbols-outlined">group</span> सार्वजनिक सहभागिता</span>
    </span>
  </div>
</div>
<main class="container-xl py-4">
