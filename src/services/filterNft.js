
function filterNft(nftArray, name) {
	return nftArray
		.map(nft => {
			if (!nft?.metadata) return null

			const hasSkinTone = nft.metadata.attributes?.find(
				item => item.trait_type === "Skin Tone" && item.value === name
			)

			if (hasSkinTone && nft.metadata.image) {
				return nft
			}

			return null
		})
		.filter(Boolean)
}

export default filterNft