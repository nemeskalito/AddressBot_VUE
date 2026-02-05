import POWER_DB from '../../power.json';

export function calcSynergy(nft) {
  if (!nft?.metadata?.attributes) return 0;

  return nft.metadata.attributes.reduce((sum, attr) => {
    const traitList =
      attr.trait_type === "Earring"
        ? POWER_DB.attributes["Earrings"]
        : POWER_DB.attributes[attr.trait_type];

    if (!traitList) return sum;

    const found = traitList.find(item => item.name === attr.value);
    return sum + (found?.power || 0);
  }, 0);
}

export function calcTotalSynergy(nfts) {
  if (!Array.isArray(nfts)) return 0;
  return nfts.reduce((sum, nft) => sum + calcSynergy(nft), 0);
}