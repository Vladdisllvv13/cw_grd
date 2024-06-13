import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAgfHpqhm8BYiQTE30cusEJMC4uK8lTPis",
  authDomain: "virt-shop.firebaseapp.com",
  databaseURL: "https://virt-shop-default-rtdb.firebaseio.com",
  projectId: "virt-shop",
  storageBucket: "virt-shop.appspot.com",
  messagingSenderId: "72126462317",
  appId: "1:72126462317:web:1eb5af9da767369cf84264",
  measurementId: "G-ZS4NNVK5K5"
};

let _userId = 'ALL';
let _productId = '';
let _product = null;
let _isFavourite = false;
let _selectedColor = null;
let _selectedSize = null;

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const clothesCollection = collection(db, 'clothes');



// Получите идентификатор пользователя из локального хранилища
async function getUserId() {
  try {
    const userId = localStorage.getItem('userId');
    if (userId === null) return 'ALL';
    else return userId;
  } catch (error) {
      return 'ALL';
  }
}



var themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
var themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

// Change the icons inside the button based on previous settings
if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    themeToggleLightIcon.classList.remove('hidden');
} else {
    themeToggleDarkIcon.classList.remove('hidden');
}

var themeToggleBtn = document.getElementById('theme-toggle');

themeToggleBtn.addEventListener('click', function() {

    // toggle icons inside button
    themeToggleDarkIcon.classList.toggle('hidden');
    themeToggleLightIcon.classList.toggle('hidden');

    // if set via local storage previously
    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        }

    // if NOT set via local storage previously
    } else {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    }
    
});

// Получите идентификатор пользователя из локального хранилища
async function getProductId() {
  try {
    const productId = localStorage.getItem('lastProductId');
    if (productId === null) return 'Error';
    else return productId;
  } catch (error) {
      return 'ALL';
  }
}

// Получите идентификатор пользователя из локального хранилища
async function getProduct(productId) {
  const clothesCollection = collection(db, 'clothes');
    const productDocRef = doc(clothesCollection, productId); // Create a document reference using the doc function
    const productDocSnapshot = await getDoc(productDocRef);

    if (productDocSnapshot.exists()) {
        console.log('Document data:', productDocSnapshot.data());
        // Access specific fields if needed, e.g., product name
        const productName = productDocSnapshot.data().name;
        console.log('Product Name:', productName);
        return productDocSnapshot.data();
    } else {
        console.log('No such document');
    }
}

async function showColorCircles(product){
  try {
    const colorsList = document.getElementById('colors');

    const colorsRef = product.idColors.map((colorId) => doc(db, 'colors', colorId.toString()));
    const colorsSnapshots = await Promise.all(colorsRef.map(async (colorRef) => {
      const colorDoc = await getDoc(colorRef);
      return { hexColor: colorDoc.data().hexColor, name: colorDoc.data().name };
    }));

    colorsSnapshots.forEach(({ hexColor, name }) => {
      const colorCircle = document.createElement('div');
      colorCircle.innerHTML = 
      `
      <button data-ui="checked active" data-tooltip-target="tooltip-bottom" data-tooltip-placement="bottom" type="button" class="bg-gray-200 dark:bg-gray-800 colorCircle p-2.5 border border-2 border-gray-800 dark:border-gray-200 rounded-full transition-all duration-300 hover:border-purple-500 focus-within:border-purple-500">
        <svg width="20" height="20" viewBox="0 0 40 40" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="${hexColor}"/>
        </svg>
      </button>
      <div id="tooltip-bottom" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
        ${name}
        <div class="tooltip-arrow" data-popper-arrow></div>
      </div>    
      `;

      const colorButton = colorCircle.querySelector('.colorCircle');
      colorButton.addEventListener('click', () => {
        // Снимаем выделение со всех кнопок
        const allColorButtons = colorsList.querySelectorAll('.colorCircle');
        allColorButtons.forEach(btn => btn.classList.remove('border-purple-500'));

        // Выделяем выбранную кнопку
        colorButton.classList.add('border-purple-500');
        _selectedColor = name;
      });

      colorsList.appendChild(colorCircle);
    });

  } catch (error) {
    console.error("Error adding colors:", error);
  }
}
async function showSizes(product){
  try {
    const sizesList = document.getElementById('sizes');

    const sizesRef = product.idSizes.map((sizeId) => doc(db, 'sizes', sizeId.toString()));
    const sizesSnapshots = await Promise.all(sizesRef.map((sizeRef) => getDoc(sizeRef)));
    const sizesValues = sizesSnapshots.map((sizeSnapshot) => sizeSnapshot.data().name);

    sizesValues.forEach((size) => {
      const sizeBlock = document.createElement('div');
      sizeBlock.innerHTML = 
      `
      <button
      class="border border-gray-800 text-gray-900 dark:text-gray-100 dark:border-gray-200 text-lg py-2 rounded-full px-1.5 sm:px-6 w-full font-semibold whitespace-nowrap shadow-sm shadow-transparent transition-all duration-300 hover:shadow-gray-300 hover:bg-gray-200 hover:border-gray-700 dark:hover:bg-gray-800 dark:hover:border-gray-300 focus-within:border-green-500">
      ${size}</button>  
      `;

      const sizeButton = sizeBlock.querySelector('button');
      sizeButton.addEventListener('click', () => {
        // Снимаем выделение со всех кнопок
        const allSizeButtons = sizesList.querySelectorAll('button');
        allSizeButtons.forEach(btn => btn.classList.remove('border-green-500'));

        // Выделяем выбранную кнопку
        sizeButton.classList.add('border-green-500');
        _selectedSize = size;
      });

      sizesList.appendChild(sizeBlock);
    });

  } catch (error) {
    console.error("Error adding sizes:", error);
  }
}

async function getProductType(productTypeId){
  const clothTypeRef = doc(db, 'clothType', productTypeId.toString());
  const clothTypeSnapshot = await getDoc(clothTypeRef);
  return clothTypeSnapshot.data().name;
}

async function getProductMaterial(productMaterialId){
  const materialRef = doc(db, 'materials', productMaterialId.toString());
  const materialSnapshot = await getDoc(materialRef);
  return materialSnapshot.data().name;
}

async function setProductDescription(product){
  const name = document.getElementById('txtName');
  const price = document.getElementById('txtPrice');
  const type = document.getElementById('txtType');
  const material = document.getElementById('txtMaterial');
  const description = document.getElementById('txtDescription');
  const image = document.getElementById('image');
  name.textContent = product.name;
  description.textContent = product.description;
  price.textContent = `${product.price} Руб.`;

  const productType = await getProductType(product.idClothType);
  type.textContent = productType;

  const productMaterial = await getProductMaterial(product.idMaterial);
  material.textContent = productMaterial;

  const storageImageRef = ref(storage, `images/${product.image}.png`);
  const imageUrl = await getDownloadURL(storageImageRef);
  image.src = imageUrl;

  showColorCircles(product);
  showSizes(product);

  const mainDescription = document.querySelector('.mainDescription');
  mainDescription.hidden = false;
}



const addToFavouritesButton = document.getElementById('addToFavouritesButton');
const addToFittingRoomButton = document.getElementById('addToFittingRoomButton');

async function addToFavourites(clothId) {
  const userCollection = collection(db, 'users');

  if(_userId === 'ALL'){
    Swal.fire({
      icon: "error",
      title: "Упс...",
      text: "Нельзя добавить одежду в избранное для незарегистрированного пользователя.",
    });
    return;
  }
  const userDoc = doc(userCollection, _userId);

  // Получаем текущие данные пользователя
  getDoc(userDoc).then((userDocSnapshot) => {
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesClothesIds = userData.idFavourites || [];

      // Проверяем, содержит ли массив уже выбранный идентификатор одежды
      if (!favouritesClothesIds.includes(clothId)) {
        // Добавляем идентификатор одежды к массиву
        favouritesClothesIds.push(clothId);

        // Обновляем данные пользователя в базе данных
        updateDoc(userDoc, { idFavourites: favouritesClothesIds }).then(() => {
          Swal.fire({
            icon: "success",
            title: "Одежда добавлена в избранное!",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(function() {
          }, 2000);
        }).catch((error) => {
          console.error('Error updating user data:', error);
        });
      }
    }
  }).catch((error) => {
    console.error('Error fetching user data:', error);
  });
}

async function removeFromFavourites(clothId){
  try {
    const userCollection = collection(db, 'users');
    const userDoc = doc(userCollection, _userId);

    // Retrieve the user document
    const userDocSnapshot = await getDoc(userDoc);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesClothesIds = userData.idFavourites || [];

      favouritesClothesIds = favouritesClothesIds.filter((id) => id !== clothId);

      // Update the user document with the modified wardrobeClothesIds array
      await updateDoc(userDoc, { idFavourites: favouritesClothesIds });

      // Optional: You can also update the UI to reflect the deletion
      // For example, remove the deleted cloth from the DOM

      Swal.fire({
        icon: "success",
        title: "Одежда удалена из избранного!",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(function() {
      }, 2000);
    }
  } catch (error) {
    console.error('Error deleting cloth:', error);
  }
}

const productCountValue = document.getElementById('productCount')

async function addToCart(){
  const cartItem = {
    idCloth: _productId,
    idUser: _userId,
    idColor: _selectedColor,
    idSize: _selectedSize,    
    quantity: parseInt(productCountValue.value)
  }
  const shoppinCartCollection = collection(db, 'shoppingCart');
  await addDoc(shoppinCartCollection, cartItem);

  let timerInterval;
  Swal.fire({
    title: "Товар добавлен в корзину!",
    timer: 2000,
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
      timerInterval = setInterval(() => {
      }, 100);
    },
    willClose: () => {
      clearInterval(timerInterval);
    }
  }).then(async (result) => {
    await getCartItemsCount(_userId).then(count => {
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

    /* Read more about handling dismissals below */
    if (result.dismiss === Swal.DismissReason.timer) {
      console.log("I was closed by the timer");
    }
  }); 
}

// Обработчик события для кнопки "to wardrobe"
async function addToFittingRoom(clothId) {
  const userCollection = collection(db, 'users');
  const userId = await getUserId();
  console.log(userId);
  if(userId === 'ALL'){
    Swal.fire({
      icon: "error",
      title: "Упс...",
      text: "Нельзя добавить одежду в примерочную для незарегистрированного пользователя!",
    });
    return;
  }
  const userDoc = doc(userCollection, userId);

  // Получаем текущие данные пользователя
  getDoc(userDoc).then((userDocSnapshot) => {
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let wardrobeClothesIds = userData.idWardrobeClothes || [];

      // Проверяем, содержит ли массив уже выбранный идентификатор одежды
      if (!wardrobeClothesIds.includes(clothId)) {
        // Добавляем идентификатор одежды к массиву
        wardrobeClothesIds.push(clothId);

        // Обновляем данные пользователя в базе данных
        updateDoc(userDoc, { idWardrobeClothes: wardrobeClothesIds }).then(() => {
          Swal.fire({
            icon: "success",
            title: "Одежда добавлена в примерочную",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(function() {
          }, 2000);
        }).catch((error) => {
          console.error('Error updating user data:', error);
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "Выбранная одежда уже есть в вашей примерочной",
        });
      }
    }
  }).catch((error) => {
    console.error('Error fetching user data:', error);
  });
}

addToFavouritesButton.addEventListener('click', function(){
  if(_userId !== 'ALL'){
    if(!_isFavourite){
      addToFavourites(_productId);
      _isFavourite = true;
    } 
    else if(_isFavourite){
      removeFromFavourites(_productId);
      _isFavourite = false;
    } 
  }
});
addToFittingRoomButton.addEventListener('click', function(){
  addToFittingRoom(_productId);
});

async function getIsFavoutite(){
  const userCollection = collection(db, 'users');
  if(_userId !== 'ALL'){
    const userDoc = doc(userCollection, _userId);

    // Получаем текущие данные пользователя
    getDoc(userDoc).then((userDocSnapshot) => {
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        let favouritesClothesIds = userData.idFavourites || [];

        // Преобразуем идентификатор одежды в числовой формат
        const clothIdNumber = parseInt(_productId, 10);

        // Проверяем, содержит ли массив уже выбранный идентификатор одежды
        if (favouritesClothesIds.includes(clothIdNumber)) {
          return true;
        }
      }})
  }
}


const minusButton = document.getElementById('minusButton');
const plusButton = document.getElementById('plusButton');
const productCount = document.getElementById('productCount');

async function minusProductCount(){
    let productCountNum = parseInt(productCount.value)
    if(productCountNum == 1){
        return;
    }
    productCountNum -= 1;
    productCount.value = productCountNum;
}
async function plusProductCount(){
    let productCountNum = parseInt(productCount.value)
    if(productCountNum == 5){
        return;
    }
    productCountNum += 1;
    productCount.value = productCountNum;
}


minusButton.addEventListener('click', function(){
    minusProductCount();
});
plusButton.addEventListener('click', function(){
    plusProductCount();
});


const cartCollection = collection(db, 'shoppingCart');
async function getCartItemsCount(idUser){
  const cartQuery = query(cartCollection, where('idUser', '==', idUser));
  const querySnapshot = await getDocs(cartQuery);
  return querySnapshot.size;
}


const notEmptyCartBlock = document.getElementById('notEmptyCartBlock');
const emptyCartBlock = document.getElementById('emptyCartBlock');
const cartModalList = document.getElementById('cartModalList');

// Функция для обработки выбора одежды
function handleEmptyCart() {
  notEmptyCartBlock.hidden = true;
  emptyCartBlock.hidden = false;
}

// Функция для обработки выбора стилей
function handleNotEmptyCart() {
  notEmptyCartBlock.hidden = false;
  emptyCartBlock.hidden = true;
}


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


async function renderCartModal(){
  cartModalList.innerHTML = ``;
  const userCartItemsQuery = query(cartCollection, where('idUser', '==', _userId));
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

const addToCartButton = document.getElementById('addToCartButton');
addToCartButton.addEventListener('click', async function(){
  await addToCart();
})

async function createLastProductBlock(data, list, productId){
  try {
    const clothesList = list;
    const clothesBlock = document.createElement('div');
    clothesBlock.classList = 'p-4 w-6/12 md:w-4/12 lg:w-3/12';
    clothesBlock.innerHTML = `
    <div class="clothContainer"> 
        <a href="#" class="block hover:opacity-75 mb-4"><img class="productImage w-full" alt="Product image" width="500" height="700"></a> 
        <a href="#" class="hover:text-gray-400 hover:underline inline-block mb-2 text-l">${data.name}</a>
        <a href="#" class="block hover:text-gray-800 mb-2 text-gray-500"><h3 class="font-medium leading-tight text-lg">${data.productType}</h3></a>
        <div class="">
            <s class="discountPrice hidden mr-2">$ 95</s>
            <span class="priceOne font-medium text-red-500">$ 1750</span>
        </div>                                 
    </div>    
    `;
    
    clothesList.appendChild(clothesBlock);
    const clothContainer = clothesBlock.querySelector('.clothContainer');
    const priceElement = clothesBlock.querySelector('.priceOne');
    const discountPriceElement = clothesBlock.querySelector('.discountPrice');
    const imageElement = clothesBlock.querySelector('.productImage'); 

    const imagePath = data.image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    imageElement.src = imageUrl;

    const price = data.price;
    const discount = data.discount;
    if(discount != 0){

      discountPriceElement.textContent = `₽ ${price}`;
      discountPriceElement.classList.remove('hidden');
      priceElement.textContent = `₽ ${price * (100 - discount) / 100}`;
    }else{
      priceElement.textContent = `₽ ${price}`;
    }


    clothContainer.hidden = false;

    if(!data.isActivated){clothContainer.classList.add('opacity-30'); return;}

    clothesBlock.querySelector('.clothContainer').addEventListener('click', () => {
      localStorage.setItem('lastProductId', productId)
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
    
      // Удаляем существующий productId, если он уже есть в массиве
      lastProducts = lastProducts.filter(productID => productID !== productId);

      // Добавляем новый ID продукта и сохраняем только последние 5 ID
      lastProducts.push(data.id);
      lastProducts = lastProducts.slice(-5);
      localStorage.setItem('lastProducts', JSON.stringify(lastProducts))
      location.reload();
    });

  } catch (error) {
    console.error("Error adding clothes:", error);
  }
}


async function showLastProducts(){
  const lastProductsList = document.getElementById('lastProductsList');
  lastProductsList.innerHTML = '';

  const lastProducts = localStorage.getItem('lastProducts') ? JSON.parse(localStorage.getItem('lastProducts')) : [];
  for (let i = 0; i < lastProducts.length - 1; i += 1) {
    if (lastProducts[i] === null) {
      // Обработка случая, когда элемент массива равен null
      console.error(`Обнаружен null в массиве lastProducts на позиции ${i}`);
      continue; // Пропускаем итерацию цикла, если значение равно null
    }
    console.log(lastProducts[i]);
    const product = await getProductById(lastProducts[i])
    if (product) {
      // Теперь мы уверены, что product не null и можем безопасно использовать его
      console.log(product);
      createLastProductBlock(product, lastProductsList, lastProducts[i]);
    } else {
      // Обработка случая, когда продукт не найден
      console.error(`Продукт с ID ${lastProducts[i]} не найден.`);
    }
  }
}

async function getProductTypeName(productTypeRef) {
  const productTypeSnapshot = await getDoc(productTypeRef);
  const productTypeValue = productTypeSnapshot.data().name;
  return productTypeValue;
}

async function getProductGenderName(clothTypeRef) {
  const clothTypeSnapshot = await getDoc(clothTypeRef);
  const clothTypeValue = clothTypeSnapshot.data().name;
  return clothTypeValue;
}

// Функция для получения продукта по ID
async function getProductById(productId) {
  const docRef = doc(db, 'clothes', productId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const name = data.name;
    const price = data.price;
    const discount = data.discount;
    const image = data.image;
    const productTypeRef = doc(db, 'clothType', data.idClothType.toString());
    const typeId = data.idClothType;
    const productGenderNameRef = doc(db, 'clothTypeGender', data.idClothTypeGender.toString());
    const isActivated = data.isActivated;

    const productType = await getProductTypeName(productTypeRef);
    const productGender = await getProductGenderName(productGenderNameRef);


    return {
      typeId,
      name,
      price,
      productType,
      productGender,
      discount,
      image,
      isActivated
    };
  } else {
    console.log('Нет такого продукта!');
    return null; // Или другое подходящее действие
  }
}

async function goToProfile(){
  if(_userId !== 'ALL') window.location.href = "user_profile.html"
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

async function main(){
  const userId = await getUserId();
  _userId = userId;
  const productId = await getProductId();
  _productId = productId;
  const product = await getProduct(_productId);
  _product = product;
  _isFavourite = await getIsFavoutite(_productId);

  await setProductDescription(product);
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add("hidden");

  await showLastProducts();

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

document.addEventListener('DOMContentLoaded', function() {
  main();
});