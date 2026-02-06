<script setup>
import { ref } from 'vue'
import getNftFromAccount from '../services/findNft'
import filterNft from '../services/filterNft'
import { calcSynergy, calcTotalSynergy, getSynergyBonus, getNumberHighlight } from '../services/calcSynergy'

const inputs = ref([
  {id: Date.now(), value: '', nfts: [], nftsByEmotion: {}, firstRowNfts: {}}
])

// Вычисляем суммарный power для строки NFT
const getRowTotalPower = (item) => {
	const allNfts = Object.values(item.firstRowNfts).filter(Boolean)
  return allNfts.length === 7 ? calcTotalSynergy(allNfts) + 350 : calcTotalSynergy(allNfts)
}

const activeNft = ref(null)
const selectedSkin = ref('')
const skins = [
  "Golden", "Cavern", "Magical", "Fairytale", "Martian", "Silver", "Desert",
  "Demonic", "Lunar", "Cosmic", "Swamp", "Meadow", "Urban", "Mountain",
  "Beach", "Taiga", "Forest", "Tropical"
]

const emotions = [
  "In Love", "Greeting", "Capped", "Shoked", "Do Something", "To The Moon", "Wen TGE"
]

const getEmotion = (nft) => {
  // Сначала ищем в атрибутах
  const emotionAttr = nft?.metadata?.attributes?.find(attr => attr.trait_type === "Emotion")
  if (emotionAttr && emotions.includes(emotionAttr.value)) return emotionAttr.value

  // Если нет атрибута — ищем в имени
  const emotionName = nft?.metadata?.name || ''
  const found = emotions.find(item => emotionName.includes(item))
  return found || null
}

// Функция для выбора NFT с наибольшей мощностью по каждой эмоции
const getTopNftFromEmotion = (nftsByEmotion) => {
  const result = {}

  for (const emotion of emotions) {
    const nftList = nftsByEmotion[emotion] || []
    if (nftList.length === 0) {
      result[emotion] = null
      continue
    }

    // Находим NFT с максимальной мощностью
    const topNft = nftList.reduce((max, nft) => {
      return calcSynergy(nft) > calcSynergy(max) ? nft : max
    }, nftList[0])

    result[emotion] = topNft
  }

  return result
}


const toggleAttributes = (id) => {
  activeNft.value = activeNft.value === id ? null : id
}

// Главная функция получения NFT для одного адреса
const getNft = async (item) => {
  try {
    const nftArray = await getNftFromAccount(item.value)
    const filteredNft = filterNft(nftArray, selectedSkin.value)

    // Группируем по эмоциям
    item.nftsByEmotion = {}
    for (const emotion of emotions) {
      item.nftsByEmotion[emotion] = []
    }
    for (const nft of filteredNft) {
      const emotion = getEmotion(nft)
      if (emotion) item.nftsByEmotion[emotion].push(nft)
    }

    // Выбираем для каждой эмоции NFT с максимальной мощностью
    item.firstRowNfts = getTopNftFromEmotion(item.nftsByEmotion)

    console.log('Top NFTs by emotion:', item.firstRowNfts)
  } catch (error) {
    console.log("Ошибка при получении NFT:", error)
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
    nfts: [],
    firstRowNfts: {}
  })
}

const onImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/150'
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
    
    <div v-for="(item, index) in inputs" :key="item.id">
      <div class="address">
        <input v-model="item.value" type="text" placeholder="Введите адрес">
        <button @click="getNft(item)">Проверить</button>
        <button class="remove" @click="removeInput(index)">Удалить</button>
      </div>
      
      <!-- Только верхняя строка -->
      <div class="top-row">
				<div class="total-power">
    			Total PWR: {{ getRowTotalPower(item) }} PWR
  			</div>
        <div class="nft__collection">
          <!-- Проходим по всем эмоциям по порядку -->
          <div 
            v-for="emotion in emotions" 
            :key="emotion" 
            class="emotion-slot"
          >
            <div class="emotion-header">{{ emotion }}</div>
            
            <div class="nft-wrapper">
                <div
                  v-if="item.firstRowNfts[emotion]"
                  class="nft__card"
                  :class="{
                    'synergy-100': getSynergyBonus(item.firstRowNfts[emotion]) === 100,
                    'synergy-200': getSynergyBonus(item.firstRowNfts[emotion]) === 200,
                    'synergy-300': getSynergyBonus(item.firstRowNfts[emotion]) === 300,
                    [getNumberHighlight(item.firstRowNfts[emotion])]: true
                  }"
                  @click="toggleAttributes(item.firstRowNfts[emotion].index)"
                >
                <img
                  class="nft__image"
                  :src="item.firstRowNfts[emotion]?.metadata?.image"
                  @error="onImageError"
                />
              
                <div
                  class="nft__attributes"
                  :class="{ show: activeNft === item.firstRowNfts[emotion].index }"
                >
                  <div v-for="(attr, i) in item.firstRowNfts[emotion]?.metadata?.attributes" :key="i">
                    {{ attr.trait_type }}: {{ attr.value }}
                  </div>
                </div>
              
                <div class="nft__name">
                  {{ item.firstRowNfts[emotion]?.metadata?.name.split(" ").slice(-1).join() || 'Без названия' }}
                </div>
                <div class="nft__power">
                  {{ calcSynergy(item.firstRowNfts[emotion]) }} PWR
                </div>
              </div>
              <!-- Пустой слот, если нет NFT для этой эмоции -->
              <div v-else class="nft__empty"></div>
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

.address, .total-power {
  padding: 0 10%;
  display: flex;
  gap: 20px;
  margin-top: 20px;
  display: flex;
  align-items: center;
}

.total-power {
	color: gold;
}

/* Контейнер для верхней строки */
.top-row {
  width: 100%;
  box-sizing: border-box;
  margin-top: 20px;
}


/* Основной контейнер для всех слотов в одной строке */
.nft__collection {
  display: flex;
	justify-content: space-around;
  gap: 15px; /* Расстояние между колонками эмоций */
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 15px;
  width: 100vw;
}

/* Слот для одной эмоции */
.emotion-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 140px; /* Ширина карточки */
  flex-shrink: 0;
  gap: 8px;
}

/* Заголовок эмоции */
.emotion-header {
  color: white;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 5px;
}

/* Обертка для NFT */
.nft-wrapper {
  width: 100%;
  height: 210px; /* Высота карточки + название */
  display: flex;
  justify-content: center;
}

.nft__card {
  position: relative;
  width: 140px;
  flex-shrink: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
}

.nft__card:hover {
  box-shadow: 0 10px 20px rgba(0,0,0,0.6);
  transform: translateY(-5px);
}

/* =========================
   Анимация свечения
========================= */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 3px currentColor, 0 0 5px currentColor, 0 0 8px currentColor;
  }
  50% {
    box-shadow: 0 0 8px currentColor, 0 0 10px currentColor, 0 0 13px currentColor;
  }
}

/* =========================
   Synergy подсветка
========================= */
.nft__card.synergy-100 {
  border: 3px solid gold;
  color: gold;
  animation: glow 1.5s infinite alternate;
}

.nft__card.synergy-200 {
  border: 3px solid deepskyblue;
  color: deepskyblue;
  animation: glow 1.5s infinite alternate;
}

.nft__card.synergy-300 {
  border: 3px solid violet;
  color: violet;
  animation: glow 1.5s infinite alternate;
}

/* =========================
   Number подсветка
========================= */
.nft__card.highlight-red {
  border: 3px solid rgb(245, 4, 48);
  color: rgb(245, 4, 48);
  animation: glow 1.5s infinite alternate;
}

.nft__card.highlight-purple {
  border: 3px solid purple;
  color: purple;
  animation: glow 1.5s infinite alternate;
}

.nft__card.highlight-blue {
  border: 3px solid rgb(74, 16, 249);
  color: rgb(74, 16, 249);
  animation: glow 1.5s infinite alternate;
}

.nft__image {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
  border-radius: 10px;
  box-shadow: inset 4px 4px 8px rgba(0,0,0,0.5),
              inset -3px -3px 6px rgba(255,255,255,0.15);
  transition: all 0.3s ease;
}

.nft__empty {
  width: 140px;
  height: 140px;
  border-radius: 10px;
  box-shadow: inset 4px 4px 8px rgba(0,0,0,0.5),
              inset -3px -3px 6px rgba(255,255,255,0.15);
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  opacity: 0.5;
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

.nft__name {
  text-align: center;
  margin-top: 5px;
  font-size: 12px;
  color: white;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 5px;
}

.nft__power {
  text-align: center;
  font-size: 15px;
  color: white;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 5px;
}

.add {
  margin: 0 10%;
  margin-top: 20px;
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

/* Скроллбар */
.nft__collection::-webkit-scrollbar {
  height: 8px;
}

.nft__collection::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.nft__collection::-webkit-scrollbar-thumb {
  background: #003070;
  border-radius: 4px;
}
</style>