<?php
// Router for PHP's built-in server (local testing only): it ignores .htaccess,
// so block the same paths here.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^/(data|partials)/|^/(config|lib|router)\.php$|\.(md|json|lock)$#', $path)) {
    http_response_code(403);
    exit('Forbidden');
}
return false;
