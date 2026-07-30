-- 0102_voice_presets_seed_i18n.sql
-- 기존 음색 프리셋 (영지·미주·연화스님·철수·호철·원미·청이·금이) 에
-- EN/JA/ZH-CN/ID 이름을 채워넣는다. 마이그 0101 로 컬럼은 추가돼 있음.
--
-- 매칭 기준: name (한국어) EXACT — 다른 프리셋 있어도 영향 없음.
-- 이미 값이 채워진 프리셋은 덮어쓴다 (관리자가 직접 넣은 값이 있다면 마이그 후
-- 어드민에서 재편집 필요) — 초기 시딩이라 리스크 낮음.

-- 영지 (Yeongji)
UPDATE voice_presets
   SET name_en = 'Yeongji',
       name_ja = 'ヨンジ',
       name_zh_cn = '永智',
       name_id = 'Yeongji'
 WHERE name = '영지';

-- 미주 (Miju)
UPDATE voice_presets
   SET name_en = 'Miju',
       name_ja = 'ミジュ',
       name_zh_cn = '美珠',
       name_id = 'Miju'
 WHERE name = '미주';

-- 연화스님 (Yeonhwa Sunim / 蓮華僧)
UPDATE voice_presets
   SET name_en = 'Ven. Yeonhwa',
       name_ja = 'ヨンファ和尚',
       name_zh_cn = '莲花法师',
       name_id = 'Bhikkhuni Yeonhwa'
 WHERE name = '연화스님';

-- 철수 (Cheolsu)
UPDATE voice_presets
   SET name_en = 'Cheolsu',
       name_ja = 'チョルス',
       name_zh_cn = '哲秀',
       name_id = 'Cheolsu'
 WHERE name = '철수';

-- 호철 (Hocheol)
UPDATE voice_presets
   SET name_en = 'Hocheol',
       name_ja = 'ホチョル',
       name_zh_cn = '浩哲',
       name_id = 'Hocheol'
 WHERE name = '호철';

-- 원미 (Wonmi)
UPDATE voice_presets
   SET name_en = 'Wonmi',
       name_ja = 'ウォンミ',
       name_zh_cn = '媛美',
       name_id = 'Wonmi'
 WHERE name = '원미';

-- 청이 (Cheongi)
UPDATE voice_presets
   SET name_en = 'Cheongi',
       name_ja = 'チョンイ',
       name_zh_cn = '清儿',
       name_id = 'Cheongi'
 WHERE name = '청이';

-- 금이 (Geumi)
UPDATE voice_presets
   SET name_en = 'Geumi',
       name_ja = 'クミ',
       name_zh_cn = '金儿',
       name_id = 'Geumi'
 WHERE name = '금이';
