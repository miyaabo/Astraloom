/**
 * Short one-line trivia per constellation (Task 7), shown in the selection
 * info panel (src/StarInfoOverlay.tsx) alongside a star's or constellation's
 * basic info. Hand-written from commonly known mythology/astronomy
 * background (Greek/Roman myth for the classical 48 constellations, plain
 * descriptive facts for the later-added modern ones) — not drawn from any
 * single external dataset or copyrighted text, so no separate attribution is
 * needed beyond this note (same "手動キュレーション" approach as
 * src/stars/starNameJa.ts's STAR_NAME_JA table). Covers all 89 catalog
 * features (IAU 88 + Serpens split), keyed by ConstellationRecord.name,
 * which is unique — `id` is not (Serpens Caput/Cauda share one, see
 * constellationTypes.ts).
 */
const CONSTELLATION_TRIVIA: Readonly<Record<string, string>> = {
  Andromeda:
    'ギリシャ神話の王女アンドロメダに由来する。肉眼で見える最遠の天体、アンドロメダ銀河を抱く星座。',
  Antlia:
    '18世紀にフランスの天文学者ラカーユが空気ポンプにちなんで名付けた、比較的新しい星座。',
  Apus: 'ニューギニアの極楽鳥にちなんで名付けられた、南天の暗い星座。',
  Aquarius: '水瓶を傾ける若者の姿を描いた、黄道十二星座のひとつ。',
  Aquila:
    'ゼウスの使いの鷲を表す星座。一等星アルタイルは七夕の彦星として知られる。',
  Ara: '神々が誓いを立てた祭壇を表す、南天の古くからの星座。',
  Aries: '黄金の羊の毛皮にまつわる神話を持つ、黄道十二星座のひとつ。',
  Auriga: '戦車を操る御者を表し、一等星カペラを含む冬の星座。',
  'Boötes':
    '熊を追う牛飼いを表す星座。一等星アークトゥルスは春の夜空でひときわ目立つ。',
  Caelum: '彫刻刀にちなんで名付けられた、南天の小さく暗い星座。',
  Camelopardalis:
    'キリンを表す、17世紀に設定された比較的新しい星座。目立つ星が少なく見つけにくい。',
  Cancer:
    'ヘラクレスと戦った蟹を表す、黄道十二星座の中でも特に暗い星座のひとつ。',
  'Canes Venatici':
    '牛飼い座のそばで猟犬を表す星座で、17世紀に設定された。',
  'Canis Major':
    'オリオンの猟犬を表し、全天で最も明るい恒星シリウスを含む。',
  'Canis Minor': 'もう一匹の猟犬を表す星座。一等星プロキオンを含む。',
  Capricornus:
    '上半身が山羊、下半身が魚の姿の神を表す、黄道十二星座のひとつ。',
  Carina: '元は巨大な「アルゴ座」の一部で、アルゴ船の竜骨を表す。',
  Cassiopeia:
    '自らの美しさを誇った王妃を表す、W字型で見つけやすい星座。',
  Centaurus: '半人半馬のケンタウロスを表す、南天の大きな星座。',
  Cepheus: 'カシオペヤの夫である王を表す、北極星の近くに位置する星座。',
  Cetus: 'アンドロメダを脅かした海の怪物を表す星座。変光星ミラを含む。',
  Chamaeleon: 'カメレオンにちなんで名付けられた、南天の小さな星座。',
  Circinus: '製図用のコンパスを表す、南天の小さな星座。',
  Columba: 'ノアの方舟から放たれた鳩を表すとされる星座。',
  'Coma Berenices':
    'エジプト王妃ベレニケが捧げた髪を表す、実在の女性に由来する数少ない星座。',
  'Corona Austrina': 'いて座の南に位置する冠を表す星座。',
  'Corona Borealis':
    '王女アリアドネの冠を表す、半円形に星が並ぶ星座。',
  Corvus: 'アポロンに仕えたカラスを表す星座。四角形の星並びが目印。',
  Crater: 'アポロンの杯を表す星座で、からす座の隣にある。',
  Crux: '南十字星として知られる、全天で最も小さい星座。',
  Cygnus:
    '白鳥に姿を変えたゼウスを表し、北十字とも呼ばれる。一等星デネブを含む。',
  Delphinus: '詩人アリオンを助けたイルカを表す、小さくかわいらしい星座。',
  Dorado:
    '大航海時代に南天で命名された、シイラ(魚)を表す星座。大マゼラン雲の一部を含む。',
  Draco:
    'ヘスペリデスの園を守る竜を表す、北極付近をとぐろを巻くように延びる星座。',
  Equuleus: '子馬を表す、全天で2番目に小さい星座。',
  Eridanus: '天空を流れる川の神を表す、南北に長く延びる星座。',
  Fornax: '化学実験用の炉にちなんで名付けられた、南天の暗い星座。',
  Gemini: '仲の良い双子カストルとポルックスを表す、黄道十二星座のひとつ。',
  Grus: '鶴を表す、大航海時代に命名された南天の星座。',
  Hercules: '怪力の英雄ヘラクレスを表す、球状星団M13を含む大きな星座。',
  Horologium: '振り子時計にちなんで名付けられた、南天の暗い星座。',
  Hydra:
    'ヘラクレスが退治した九つ首の大蛇を表す、全天で最も面積の広い星座。',
  Hydrus: 'うみへび座とは別の、小さな水蛇を表す南天の星座。',
  Indus: '大航海時代にアメリカ先住民にちなんで名付けられた星座。',
  Lacerta: '小さなトカゲを表す、17世紀に設定された目立たない星座。',
  Leo:
    'ヘラクレスが倒した獅子を表す、鎌のような星並びが特徴の黄道十二星座。',
  'Leo Minor': 'しし座の北に位置する、小さな獅子を表す星座。',
  Lepus: 'オリオンに追われるウサギを表す、オリオン座の足元の星座。',
  Libra:
    '正義の女神が持つ天秤を表す、黄道十二星座で唯一生き物でない星座。',
  Lupus: 'ケンタウルスに捕らえられた狼を表す、南天の星座。',
  Lynx: '見つけるには山猫のような鋭い目が必要、という意味で名付けられた暗い星座。',
  Lyra: '詩人オルフェウスの竪琴を表す。一等星ベガは七夕の織姫として知られる。',
  Mensa:
    '南アフリカのテーブルマウンテンにちなんで名付けられた、全天で最も暗い星座。',
  Microscopium: '顕微鏡にちなんで名付けられた、南天の暗い星座。',
  Monoceros:
    '一角獣(ユニコーン)を表す、冬の大三角の内側に位置する星座。',
  Musca: '南天で唯一昆虫を表す星座で、南十字星のすぐ南にある。',
  Norma: '大工道具の定規にちなんで名付けられた、南天の小さな星座。',
  Octans:
    '天の南極を含む星座で、反射望遠鏡の考案者にちなむ八分儀を表す。',
  Ophiuchus: '蛇使いを表す、13番目の黄道星座とも呼ばれる大きな星座。',
  Orion:
    '狩人オリオンを表す、三ツ星で知られる全天で最も見つけやすい星座のひとつ。',
  Pavo: '孔雀を表す、大航海時代に命名された南天の星座。',
  Pegasus:
    '翼を持つ天馬を表す、秋の四辺形として知られる大きな星座。',
  Perseus:
    'アンドロメダを救った英雄ペルセウスを表し、変光星アルゴルを含む。',
  Phoenix: '不死鳥にちなんで名付けられた、南天の星座。',
  Pictor:
    '画家の絵筆(イーゼル)にちなんで名付けられた、南天の暗い星座。',
  Pisces:
    '愛の女神アフロディーテと息子が姿を変えた二匹の魚を表す、黄道十二星座。',
  'Piscis Austrinus':
    '南の空にいる大きな魚を表す星座。一等星フォーマルハウトを含む。',
  Puppis: '元は「アルゴ座」の一部で、アルゴ船の船尾を表す。',
  Pyxis: '航海用の羅針盤にちなんで名付けられた、南天の小さな星座。',
  Reticulum:
    '望遠鏡の十字線(レチクル)にちなんで名付けられた、南天の小さな星座。',
  Sagitta: '矢を表す、小さいながらも古くから知られる星座。',
  Sagittarius:
    '弓を引くケンタウロスを表す、天の川銀河の中心方向に広がる星座。',
  Scorpius: 'オリオンを刺し殺したサソリを表す星座。赤い一等星アンタレスを含む。',
  Sculptor: '彫刻家のアトリエにちなんで名付けられた、南天の暗い星座。',
  Scutum: 'ポーランド国王を称えて名付けられた、盾を表す小さな星座。',
  'Serpens Caput':
    'へびつかい座に抱えられた蛇の頭側を表す。全天で唯一2つに分かれた星座の片方。',
  'Serpens Cauda':
    '同じ蛇の尾側を表す部分。頭側とは、へびつかい座を挟んで離れて位置する。',
  Sextans:
    '天体観測用の六分儀にちなんで名付けられた、しし座の下に位置する暗い星座。',
  Taurus:
    'ゼウスが姿を変えた牡牛を表す。すばる(プレアデス星団)を含む黄道十二星座。',
  Telescopium: '望遠鏡にちなんで名付けられた、南天の暗い星座。',
  Triangulum: '三角形の星並びが目印の小さな星座。アンドロメダ座の隣にある。',
  'Triangulum Australe':
    '南天版の三角座で、比較的明るい三つの星からなる。',
  Tucana:
    'オオハシ(トゥーカン)にちなんで名付けられた星座。小マゼラン雲の一部を含む。',
  'Ursa Major':
    '北斗七星を含む、最もよく知られた星座のひとつ。妖精カリストが姿を変えた熊とされる。',
  'Ursa Minor': '北極星ポラリスを含む、小さな熊を表す星座。',
  Vela: '元は「アルゴ座」の一部で、アルゴ船の帆を表す。',
  Virgo:
    '豊穣の女神を表す、黄道十二星座で最も面積の広い星座。一等星スピカを含む。',
  Volans: 'トビウオにちなんで名付けられた、南天の小さな星座。',
  Vulpecula: '小さなキツネを表す、や座の近くにある目立たない星座。',
}

export function findConstellationTrivia(name: string): string | null {
  return CONSTELLATION_TRIVIA[name] ?? null
}
