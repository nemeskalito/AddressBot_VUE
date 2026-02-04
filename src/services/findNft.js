import axios from 'axios'

const COLLECTION = "EQBGNoXXfQR07HdDhtkmIu1ojTTwcjB0EhHYOMSH3P7sZGJR"

async function getNftFromAccount(ACCOUNT_ID) {
	try {
		const { data } = await axios.get(`https://tonapi.io/v2/accounts/${ACCOUNT_ID}/nfts?collection=${COLLECTION}&limit=1000&offset=0&indirect_ownership=true`)
		return data.nft_items
	} catch (error) {
		console.log("Ошибка получения нфт", error.message)
	}
}

export default getNftFromAccount