import POWER_DB from '../../power.json';

/* =========================
   BASE POWER (ТВОЯ ЛОГИКА)
========================= */

function calcBasePower(attributes) {
  return attributes.reduce((sum, attr) => {
    const traitList =
      attr.trait_type === "Earring"
        ? POWER_DB.attributes["Earrings"]
        : POWER_DB.attributes[attr.trait_type];

    if (!traitList) return sum;

    const found = traitList.find(item => item.name === attr.value);
    return sum + (found?.power || 0);
  }, 0);
}

/* =========================
   SYNERGY (БЕЗ SKIN TONE)
========================= */

function extractSynergyTokens(attributes) {
  const tokens = [];

  for (const attr of attributes) {
    if (attr.trait_type === "Skin Tone") continue;

    const value = String(attr.value).toLowerCase();

    for (const key of POWER_DB.synergy) {
      if (value.includes(key.toLowerCase())) {
        tokens.push(key);
      }
    }
  }

  return tokens;
}

function calcSynergyBonus(attributes) {
  const tokens = extractSynergyTokens(attributes);

  const counter = tokens.reduce((acc, token) => {
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});

  let synergyScore = 0;

  for (const count of Object.values(counter)) {
    if (count === 2) synergyScore += 1;
    if (count === 3) synergyScore += 3;
  }

  if (synergyScore >= 3) return 300;
  if (synergyScore === 2) return 200;
  if (synergyScore === 1) return 100;

  return 0;
}

/* =========================
   NUMBER POWER + HIGHLIGHT
========================= */

function calcNumberPower(stickerNumber) {
  if (stickerNumber == null) return 0;

  const found = POWER_DB.number_power.find(
    n => n.sticker_number === stickerNumber
  );

  return found?.power || 0;
}

// Возвращает класс подсветки по мощности номера
function getNumberHighlightClass(stickerNumber) {
  const power = calcNumberPower(stickerNumber);

  if (power >= 1000) return 'highlight-red';
  if (power >= 500) return 'highlight-purple';
  if (power >= 100) return 'highlight-blue';
}

/* =========================
   CALC SYNERGY + TOTAL POWER
========================= */

export function calcSynergy(nft) {
  if (!nft?.metadata?.attributes) return 0;

  const attributes = nft.metadata.attributes;
  const basePower = calcBasePower(attributes);
  const synergyBonus = calcSynergyBonus(attributes); // 0, 100, 200, 300

  // BONUS за номер стикера
  const stickerNumber = nft.metadata?.sticker_number;
  const numberPower = calcNumberPower(stickerNumber);

  return basePower + synergyBonus + numberPower;
}

// Для Vue-шаблона: вернуть бонус синергии + номер
export function getSynergyBonus(nft) {
  if (!nft?.metadata?.attributes) return 0;
  const attributes = nft.metadata.attributes;
  const synergyBonus = calcSynergyBonus(attributes);
  const numberPower = calcNumberPower(nft.metadata?.sticker_number);

  return synergyBonus + numberPower;
}

// Для подсветки номера
export function getNumberHighlight(nft) {
  return getNumberHighlightClass(nft.metadata?.sticker_number);
}

// Общая сумма всех NFT
export function calcTotalSynergy(nfts) {
  if (!Array.isArray(nfts)) return 0;
  return nfts.reduce((sum, nft) => sum + calcSynergy(nft), 0);
}
