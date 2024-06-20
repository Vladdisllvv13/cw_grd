import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, addDoc, query, where } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import './catalog.css';

// Получаем идентификатор пользователя из локального хранилища
async function getUserId(){
  try{
    const userId = localStorage.getItem('userId');
    if(userId === null){
      return 'ALL'
    }
    else return userId;
  }
  catch(error){
    return "ALL"
  }
}

const firebaseConfig = {
    apiKey: "AIzaSyAgfHpqhm8BYiQTE30cusEJMC4uK8lTPis",
    authDomain: "virt-shop.firebaseapp.com",
    projectId: "virt-shop",
    storageBucket: "virt-shop.appspot.com",
    messagingSenderId: "72126462317",
    appId: "1:72126462317:web:1eb5af9da767369cf84264",
    measurementId: "G-ZS4NNVK5K5"
  };
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const clothesCollection = collection(db, 'clothes');
const cartCollection = collection(db, 'shoppingCart');
const clothesSnapshot = await getDocs(clothesCollection);
let clothesData = [];
let userClothesData = [];

// Получаем данные о пользователе
const userCollection = collection(db, 'users');
const userId = await getUserId()
if(userId === 'ALL'){window.location.href = 'index.html';}

//Полчуение размера
async function getProductSizes(sizeRefs) {
  const sizeSnapshots = await Promise.all(sizeRefs.map((sizeRef) => getDoc(sizeRef)));
  const sizes = sizeSnapshots.map((sizeSnapshot) => sizeSnapshot.data().name).join(', ');
  return sizes;
}

//Полчуение типа товара
async function getProductTypeName(productTypeRef) {
  const productTypeSnapshot = await getDoc(productTypeRef);
  const productTypeValue = productTypeSnapshot.data().name;
  return productTypeValue;
}

// Получение инф-ции о мужской/женской 
async function getProductGenderName(clothTypeRef) {
  const clothTypeSnapshot = await getDoc(clothTypeRef);
  const clothTypeValue = clothTypeSnapshot.data().name;
  return clothTypeValue;
}

// Получение товаров
async function getProducts(snapshot){
  const promises = [];
  const neededData = [];

  snapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;
    const idColors = data.idColors;
    const idSizes = data.idSizes;
    const name = data.name;
    const price = data.price;
    const discount = data.discount;
    const image = data.image;
    const createAt = data.createAt;
    const isActivated = data.isActivated;


    const sizeRefs = idSizes.map((sizeId) => doc(db, 'sizes', sizeId.toString()));

    const productTypeRef = doc(db, 'clothType', data.idClothType.toString());
    const productGenderNameRef = doc(db, 'clothTypeGender', data.idClothTypeGender.toString());

    promises.push(getProductTypeName(productTypeRef));
    promises.push(getProductGenderName(productGenderNameRef));
    promises.push(getProductSizes(sizeRefs));


    neededData.push({
      idColors,
      idSizes,
      id,
      name,
      price,
      productType: null,
      productGender: null,
      productSizes: null,
      discount,
      image,
      createAt,
      isActivated
    });
  });

  const results = await Promise.all(promises);

  for (let i = 0; i < results.length; i += 3) {
    neededData[i / 3].productType = results[i];
    neededData[i / 3].productGender = results[i + 1];
    neededData[i / 3].productSizes = results[i + 2];
  }

  return neededData;
}


async function getUserFavorites(clothesData){
  const userSnapshot = await getDoc(doc(userCollection, `${userId}`));
  const userData = userSnapshot.data();
  
  // Преобразуем идентификаторы в строковый формат
  const userFavouritesIds = userData.idFavourites.map(String);
  // Фильтруем данные об одежде по идентификаторам из коллекции clothes
  const userClothesData = clothesData.filter((cloth) => userFavouritesIds.includes(cloth.id));
  return(userClothesData);
}




//Создаем блок товара
async function createClothBlock(data, list) {
  try {
    let isFavourite;
    const clothesList = document.getElementById(list);
    const clothesBlock = document.createElement('div');
    clothesBlock.hidden = true;
    clothesBlock.innerHTML = `
        <div class="relative rounded-bl-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 bg-gray-200"">
          <div class="p-4">
            <div class="isNew absolute top-0 left-0 py-2 px-4 bg-purple-500 bg-opacity-50 text-gray-200 dark:text-gray-800" hidden><p class="text-xs leading-3 text-gray-100 dark:text-gray-800">New</p></div>
            <div class="bg-white bg-opacity-50 absolute top-0 right-0 px-2 py-1"><p class="text-gray-800 dark:text-white fonr-normal text-base leading-4">${data.productSizes}</p></div>
            <div class="relative group">
                <div class="flex justify-center items-center opacity-0 bg-gradient-to-t from-gray-200 dark:from-gray-800 via-gray-300 dark:via-gray-800 to-opacity-30 group-hover:opacity-50 absolute top-0 left-0 h-full w-full"></div>
                <img class="productImage h-64 object-center object-scale-down w-full group-hover:scale-105"/>
                <div class="absolute bottom-0 p-8 w-full opacity-0 group-hover:opacity-100">
                    <button class="productButton font-medium text-base leading-4 text-gray-800 bg-white py-3 w-full">Подробнее</button>
                    <button class="removeFromFavouritesButton bg-transparent font-medium text-base leading-4 border-2 border-white py-3 w-full mt-2 text-white">Удалить из избранного</button>
                </div>
            </div>
            <p class="font-normal dark:text-white text-xl leading-5 text-gray-700 dark:text-gray-300 md:mt-6 mt-4">${data.name}</p>
            <p class="priceOne font-semibold dark:text-gray-300 text-xl leading-5 text-purple-400 mt-4">$1550</p>
            <p class="colorsCount font-normal dark:text-gray-300 text-base leading-4 text-gray-500 mt-4">2 цвета</p>
            <div class="bg-gray-300 dark:bg-gray-700 absolute bottom-0 rounded-tl-lg right-0 px-2 py-1"><p class="text-purple-600 dark:text-purple-400 fonr-normal text-base leading-4">${data.productGender}</p></div>
          </div>
        </div>
          `;
    
    const priceElement = clothesBlock.querySelector('.priceOne');
    const isNewElement = clothesBlock.querySelector('.isNew');
    const colorsCountElement = clothesBlock.querySelector('.colorsCount');
    const imageElement = clothesBlock.querySelector('.productImage'); 


    const imagePath = data.image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    imageElement.src = imageUrl;

    const price = data.price;
    const discount = data.discount;
    if(discount != 0){
      priceElement.textContent = `₽ ${price * (100 - discount) / 100}`;
    }else{
      priceElement.textContent = `₽ ${price}`;
    }

    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const createAt = new Date(data.createAt);
    if(createAt >= thirtyDaysAgo && createAt <= currentDate){
      isNewElement.textContent = 'Новинка'; 
      isNewElement.hidden = false;
    };

    const colors = data.idColors.length;
    colorsCountElement.textContent = `${colors} цвет.`;


    clothesBlock.querySelector('.removeFromFavouritesButton').addEventListener('click', () => {
      const clothId = data.id;
      removeFromFavourites(clothId);
    });

    clothesBlock.querySelector('.productButton').addEventListener('click', () => {
      localStorage.setItem('lastProductId', data.id)
      // Получаем значение из localStorage и проверяем, является ли оно массивом
      let lastProducts = localStorage.getItem('lastProducts');
      try {
        lastProducts = lastProducts ? JSON.parse(lastProducts) : [];
        if (!Array.isArray(lastProducts)) {
          throw new Error('lastProducts is not an array');
        }
      } catch (error) {
        console.error('Error parsing lastProducts from localStorage:', error);
        lastProducts = []; // Инициализируем как пустой массив, если возникла ошибка
      }
    
      // Удаляем существующий data.id, если он уже есть в массиве
      lastProducts = lastProducts.filter(productID => productID !== data.id);

      // Добавляем новый ID продукта и сохраняем только последние 5 ID
      lastProducts.push(data.id);
      lastProducts = lastProducts.slice(-5);
      localStorage.setItem('lastProducts', JSON.stringify(lastProducts));
      console.log(lastProducts)
      window.location.href = 'product_overview.html';
    });

    clothesBlock.hidden = false;
    clothesList.appendChild(clothesBlock);

  } catch (error) {
    console.error("Error adding clothes:", error);
  }
}

// Удаление товара из избранного
async function removeFromFavourites(clothId){
  try {
    const userCollection = collection(db, 'users');
    const userDoc = doc(userCollection, userId);

    const userDocSnapshot = await getDoc(userDoc);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesClothesIds = userData.idFavourites || [];
      console.log(favouritesClothesIds)

      favouritesClothesIds = favouritesClothesIds.filter((id) => id !== clothId);

      await updateDoc(userDoc, { idFavourites: favouritesClothesIds });

      Swal.fire({
        icon: "success",
        title: "Одежда удалена из избранного!",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(async function() {
        clothesData = await getProducts(clothesSnapshot);
        userClothesData = await getUserFavorites(clothesData)
        await renderClothes(userClothesData);
      }, 2000);
    }
  } catch (error) {
    console.error('Error deleting cloth:', error);
  }
}



//Рендерим все найденное
async function renderClothes(clothes) {
  const clothesList = document.getElementById('favouritesList');
  clothesList.innerHTML = ''; // Очищаем лист

  let index = 0;
  for (const data of clothes) {
    if (!data.isActivated) {
      continue; // Пропускаем итерацию, если условие истинно
    }
    createClothBlock(data, 'favouritesList');
    index += 1;
  }
  const countText = document.getElementById('countText');
  countText.textContent = `Показано ${index} товаров`
}


// Получение количества товаров
async function getCartItemsCount(idUser){
  const cartQuery = query(cartCollection, where('idUser', '==', idUser));
  const querySnapshot = await getDocs(cartQuery);
  return querySnapshot.size;
}


const notEmptyCartBlock = document.getElementById('notEmptyCartBlock');
const emptyCartBlock = document.getElementById('emptyCartBlock');
const cartModalList = document.getElementById('cartModalList');

// Функция для обработки пустой корзины
function handleEmptyCart() {
  notEmptyCartBlock.hidden = true;
  emptyCartBlock.hidden = false;
}

// Функция для обработки непустой корзины
function handleNotEmptyCart() {
  notEmptyCartBlock.hidden = false;
  emptyCartBlock.hidden = true;
}

//Создание элемента корзины меню
async function populateCartList(data, itemId){
  const userClothesItemsQuery = doc(clothesCollection, data.idCloth);

  // Получение данных из запроса
  getDoc(userClothesItemsQuery).then((doc) => {
      if (doc.exists()) {
      // Доступ к данным документа и вывод информации о каждом элементе одежды
      const productData = doc.data();
      const cartModalBlock = document.createElement('section');
      cartModalBlock.innerHTML = `
      <li class="flex items-center mb-2 rounded-md border border-2 border-gray-600 gradientReverse p-4 justify-center bg-opacity-75">
        <div class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
          <img src="" alt="image" class="Img h-full w-full object-cover object-center">
        </div>

        <div class="ml-4 flex flex-1 flex-col">
          <div>
            <div class="flex justify-between text-base font-medium text-gray-100">
              <h3>
                <a href="#" class="text-gray-700 dark:text-gray-100">${productData.name}</a>
              </h3>
              <p class="ml-4 text-sm text-red-500">₽${productData.price}</p>
            </div>
          </div>
          <div class="flex flex-1 items-end justify-between text-l">
            <p class="text-red-500">-${productData.discount}%</p>

            <div class="flex">
              <button type="button" class="deleteFromCartButton font-medium text-purple-400 hover:text-purple-300">Удалить</button>
            </div>
          </div>
        </div>
      </li>
      `;
      const clothImage = cartModalBlock.querySelector('.Img');
      const image = productData.image;
      const storageImageRef = ref(storage, `images/${image}.png`);
      const imageUrlPromise = getDownloadURL(storageImageRef);
      imageUrlPromise.then((imageUrl) => {
      clothImage.src = imageUrl;
      }).catch((error) => {
      console.log('Error retrieving image URL:', error);
      });
    
      const deleteFromCartButton = cartModalBlock.querySelector('.deleteFromCartButton');
      deleteFromCartButton.addEventListener('click', () => {
        deleteFromCart(itemId);
      });

      cartModalList.appendChild(cartModalBlock);

    } else {
    console.log('Документ не найден!');
    }
  }).catch((error) => {
      console.log('Ошибка:', error);
  });
}

//рендер еорзины меню
async function renderCartModal(){
  cartModalList.innerHTML = ``;
  const userCartItemsQuery = query(cartCollection, where('idUser', '==', userId));
  const querySnapshots = await getDocs(userCartItemsQuery);
  if(querySnapshots.empty){
    handleEmptyCart();
    return;
  } 
  // Получение данных из запроса
  getDocs(userCartItemsQuery).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      // Доступ к данным каждого документа и вывод информации о каждом элементе одежды
      const data = doc.data();
      populateCartList(data, doc.id)
    });
    
  });
}

//Переход на страницу входа
async function goToProfile(){
  if(userId !== 'ALL') window.location.href = "user_profile.html"
  else{
    Swal.fire({
      title: "Вы не вошли в систему. Перейти на страницу аутентификации?",
      showCancelButton: true,
      confirmButtonText: "Перейти",
      cancelButtonText: "Отмена",
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        window.location.href = "auth.html"
      }
    });
  }
}

// Выход из профиля
async function exitUser(){
  Swal.fire({
    title: "Вы уверены, что хотите выйти?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    cancelButtonText: "Отмена",
    confirmButtonText: "Да!"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        localStorage.setItem('userId', 'ALL');
        window.location.href = 'index.html';
      } catch (error) {
        console.log('Ошибка при удалении документа:', error);
        showAlert("Не удалось выйти из системы!");
      }
    }
  });
}

const toProfileButton = document.getElementById('toProfileButton');
toProfileButton.addEventListener('click', goToProfile);

const authButton = document.getElementById('authButton');
authButton.addEventListener('click', goToProfile);

const toProfileButtonMoile = document.getElementById('toProfileButtonMoile');
toProfileButtonMoile.addEventListener('click', goToProfile);

const exitButton = document.getElementById('exitButton');
exitButton.addEventListener('click', exitUser);

// Главная функция
async function main(){
    
  if(userId !== 'ALL'){
    clothesData = await getProducts(clothesSnapshot);
    userClothesData = await getUserFavorites(clothesData)
    await renderClothes(userClothesData);
  }
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add("hidden");

  await getCartItemsCount(userId).then(count => {
    console.log(`Количество документов с idUser ${userId}: ${count}`);
    const countElement = document.getElementById('cartCounter');
    countElement.textContent = count;
    if(count > 0) {
      renderCartModal();
      handleNotEmptyCart()
    }
    else{
      handleEmptyCart();
    }
  })
}

main();


