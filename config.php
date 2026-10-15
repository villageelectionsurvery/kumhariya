<?php
/*
 * Survey configuration. Edit this file to change the posts, wards, parties or
 * optional fields. Each post's "label" is the key used in leads.json, so keep a
 * label unchanged once responses exist for it.
 */

return [
    'survey_title' => 'ग्राम कुम्हारिया चुनाव सर्वेक्षण',
    'village' => 'ग्राम पंचायत कुम्हारिया',
    'timezone' => 'Asia/Kolkata',

    // Help number shown in the header ("नागरिक सहायता"). Leave empty to hide it.
    'helpline' => '',

    // Survey data file. The data/ folder is blocked from direct web access.
    'data_file' => __DIR__ . '/data/leads.json',

    // Election posts, shown in this order. Add, remove or rename entries here.
    //   id    – short identifier used in the form (letters, digits, underscore)
    //   label – name stored in leads.json and shown on the results page
    //   title – heading shown on the survey card
    //   tag   – small category label above the heading
    'posts' => [
        ['id' => 'sarpanch',    'label' => 'सरपंच',              'title' => 'सरपंच (Sarpanch)',          'tag' => 'मुख्य पद'],
        ['id' => 'upsarpanch',  'label' => 'उपसरपंच',            'title' => 'उपसरपंच (Up-Sarpanch)',     'tag' => 'पंचायत उप-प्रमुख'],
        ['id' => 'ward_1',      'label' => 'वार्ड पंच - वार्ड 1', 'title' => 'वार्ड पंच — वार्ड संख्या 1', 'tag' => 'वार्ड पंच'],
        ['id' => 'ward_2',      'label' => 'वार्ड पंच - वार्ड 2', 'title' => 'वार्ड पंच — वार्ड संख्या 2', 'tag' => 'वार्ड पंच'],
        ['id' => 'ward_3',      'label' => 'वार्ड पंच - वार्ड 3', 'title' => 'वार्ड पंच — वार्ड संख्या 3', 'tag' => 'वार्ड पंच'],
    ],

    // Options shown for every post. The option with 'independent' => true asks
    // for the candidate's name.
    'parties' => [
        ['id' => 'congress',    'label' => 'कांग्रेस', 'hint' => 'Congress',     'icon' => 'pan_tool',   'color' => '#1E5AA8'],
        ['id' => 'bjp',         'label' => 'बीजेपी',   'hint' => 'BJP',          'icon' => 'spa',        'color' => '#D97706'],
        ['id' => 'independent', 'label' => 'निर्दलीय', 'hint' => 'Independent',  'icon' => 'person_pin', 'color' => '#2E7D32', 'independent' => true],
    ],

    // Optional respondent details. Both are off by default; only turn them on
    // if you really need them, and update the privacy notice if you do.
    'optional_fields' => [
        'name'  => false,
        'phone' => false,
    ],
];
