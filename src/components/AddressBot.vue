<script setup>
import { ref } from 'vue'
import getNftFromAccount from '../services/findNft'
import filterNft from '../services/filterNft'


const activeNft = ref(null)
const selectedSkin = ref('')
const skins = [
	"Golden", "Cavern", "Magical", "Fairytale", "Martian", "Silver", "Desert",
	"Demonic", "Lunar", "Cosmic", "Swamp", "Meadow", "Urban", "Mountain",
	"Beach", "Taiga", "Forest", "Tropical"
]

const emotions = [
	"To The Moon", "Greeting", "Capped", "Shoked", "In Love", "Do Something", "Wen TGE"
]

const getEmotion = (nft) => {
	const emotionName = nft?.metadata?.name
	return emotions.filter(item => emotionName.slice(3, -5).includes(item)).join()
}

const groupByEmotion = (nfts) => {
	const result = {}

	for (const emotion of emotions) {
		result[emotion] = []
	}

	for (const nft of nfts) {
		const emotion = getEmotion(nft)
		if (result[emotion]) {
			result[emotion].push(nft)
		}
	}

	return result
}


const inputs = ref([
	{id: Date.now(), value: '', nfts: [], nftsByEmotion: {}}
])

const toggleAttributes = (id) => {
	activeNft.value = activeNft.value === id ? null : id
	getEmotion(activeNft)
}

const getNft = async (item) => {
	try {
		const nftArray = await getNftFromAccount(item.value)
		const filteredNft = filterNft(nftArray, selectedSkin.value)
		item.nftsByEmotion = groupByEmotion(filteredNft)
	} catch (error) {
		console.log("Ошибка")
	}
}

const getAllNft = async () => {
	for (const item of inputs.value) {
		if (!item.value) continue
		await getNft(item)
	}
}

const removeInput = (index) => {
	inputs.value.splice(index, 1)
}

const addInput = () => {
	inputs.value.push({
		id: Date.now() + Math.random(),
		value: '',
		nfts: []
	})
}

const onImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/150' // картинка-заглушка
}

</script>

<template>
  <div class="header">
			<div class="title">
				<label class="skin-tone">Выберите цвет:
					<select v-model="selectedSkin">
						<option disabled value="">Выберите...</option>
						<option v-for="(skin, index) in skins" :key="index" :value="skin">
							{{ skin }}
						</option>
					</select>
				</label>
				<div class="text">Введите TON адрес:
					<button @click="getAllNft">
						Проверить все
					</button>
				</div>
			</div>
		
		<div v-for="(item, index) in inputs" :key="item.id" >
			<div class="address">
				<input v-model="item.value" type="text" placeholder="Введите адрес">
				<button @click="getNft(item)">Проверить</button>
				<button class="remove" @click="removeInput(index)">Удалить</button>
			</div>
			
			<div class="nft__collection">
				<div v-for="(nfts, emotion) in item.nftsByEmotion" :key="emotion">
					<div :class="nft ? 'nft__card' : 'nft__empty'" v-for="nft in nfts" :key="nft.index" @click="toggleAttributes(nft.index)">
						<img 
							class="nft__image" 
							:src="nft?.metadata?.image"
							@error="onImageError"
						>
    				<!-- Атрибуты, которые показываются при наведении -->
    				<div class="nft__attributes" :class="{ show: activeNft === nft.index}">
    				  <div v-for="(attr, i) in nft?.metadata?.attributes" :key="i">
    				    {{ attr.trait_type }}: {{ attr.value }}
    				  </div>
    				</div>
						<div class="nft__name">
							{{ nft?.metadata?.name || 'Без названия' }}
						</div>
					</div>
				</div>

			</div>


		</div>
		<button @click="addInput" class="add">Добавить</button>
	</div>
</template>

<style scoped>
.header {
	position: absolute;
	width: 100vw;
	left: 50%;
	top: 20px;
	transform: translateX(-50%);
  color: white;
	font-size: 25px;
}
.title {
	margin-left: 10%;
}

.address {
	padding: 0 10%;
	display: flex;
	gap: 20px;
	margin-top: 20px;
	display: flex;
	align-items: center;
}

.nft__collection {
  display: flex;
	justify-content: space-around;
  gap: 10px;
  margin-top: 20px;
  overflow-x: auto;  /* горизонтальный скролл */
  overflow-y: hidden;
  padding-bottom: 10px; /* чтобы скролл был виден */
}
.nft__empty {
	width: 100px;
	height: 100px;
	background-color: red;
}
.nft__card {
  position: relative;
  width: 140px;       /* фиксированная ширина */
  flex-shrink: 0;     /* запрещаем сжиматься */
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
}

.nft__card:hover {
  box-shadow: 0 10px 20px rgba(0,0,0,0.6);
  transform: translateY(-5px);
}

.nft__image {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
  border-radius: 10px; /* оставляем как у тебя */
  
  /* эффект вдавленности только на картинку */
  box-shadow: inset 4px 4px 8px rgba(0,0,0,0.5),
              inset -3px -3px 6px rgba(255,255,255,0.15);
  
  transition: all 0.3s ease;
}

.nft__card:hover .nft__image {
  box-shadow: inset 4px 4px 8px rgba(0,0,0,0.5),
              inset -3px -3px 6px rgba(255,255,255,0.15),
              0 5px 10px rgba(0,0,0,0.3); /* чуть внешняя тень при hover */
}

.nft__attributes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  color: white;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
  text-align: center;
  padding: 5px;
  box-sizing: border-box;
  overflow-y: auto;
}

.nft__attributes.show {
  opacity: 1;
}

.nft__card:hover .nft__attributes {
  opacity: 1;
}

.nft__name {
  text-align: center;
  margin-top: 5px;
  font-size: 14px;
  color: white;
}


.add {
	margin: 0 10%;
}

select {
	border-radius: 10px;
	border: none;
	font-size: 18px;
  background: #2b5ae6;
}

option {
	background-color: #1451b4;
}
button {
  color: white;
  background: #003070;
  border-radius: 12px;
  padding: 5px 12px;
  height: 30px;
  border: none;
  cursor: pointer;

  box-shadow:
    inset 2px 2px 5px rgba(0, 0, 0, 0.5),
    inset -2px -2px 5px rgba(255, 255, 255, 0.15);
}

button:active {
  box-shadow:
    inset 4px 4px 6px rgba(0, 0, 0, 0.6),
    inset -1px -1px 3px rgba(255, 255, 255, 0.1);
}

input {
  color: white;
  background: #003070;
  border-radius: 12px;
  width: 100%;
  height: 30px;
  padding: 0 10px;
  border: none;

  box-shadow:
    inset 3px 3px 6px rgba(0, 0, 0, 0.6),
    inset -2px -2px 4px rgba(255, 255, 255, 0.15);
}

input:focus {
  outline: none;
  box-shadow:
    inset 4px 4px 8px rgba(0, 0, 0, 0.7),
    inset -2px -2px 5px rgba(255, 255, 255, 0.2);
}

.picture {
  padding: 6px;
  border-radius: 14px;
  background: #2b5ae6;

  box-shadow:
    inset 4px 4px 8px rgba(0, 0, 0, 0.6),
    inset -3px -3px 6px rgba(255, 255, 255, 0.2);
}

img {
  width: 120px;
  height: 120px;
  border-radius: 10px;
  display: block;
}
</style>
