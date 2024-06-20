import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, addDoc, query, where, size, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import KeenSlider from 'keen-slider'

//Создание объекта KeenSlider для секции с товарами
const keenSlider = new KeenSlider(
  '#keen-slider',
  {
    loop: true,
    slides: {
      origin: 'center',
      perView: 1.25,
      spacing: 16,
    },
    breakpoints: {
      '(min-width: 1024px)': {
        slides: {
          origin: 'auto',
          perView: 1.5,
          spacing: 32,
        },
      },
    },
  },
  []
)

const keenSliderPrevious = document.getElementById('keen-slider-previous')
const keenSliderNext = document.getElementById('keen-slider-next')

const keenSliderPreviousDesktop = document.getElementById('keen-slider-previous-desktop')
const keenSliderNextDesktop = document.getElementById('keen-slider-next-desktop')

keenSliderPrevious.addEventListener('click', () => keenSlider.prev())
keenSliderNext.addEventListener('click', () => keenSlider.next())

keenSliderPreviousDesktop.addEventListener('click', () => keenSlider.prev())
keenSliderNextDesktop.addEventListener('click', () => keenSlider.next())

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

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const cartCollection = collection(db, 'shoppingCart');
const clothesCollection = collection(db, 'clothes');
let _userId;

// Получение идентификатора пользователя
async function getUserId() {
  try {
    const userId = localStorage.getItem('userId');
    if (userId === null) return 'ALL';
    else return userId;
  } catch (error) {
      return 'ALL';
  }
}

//Получение размеров товара из базы данных
async function getProductSizes(sizeRefs) {
  const sizeSnapshots = await Promise.all(sizeRefs.map((sizeRef) => getDoc(sizeRef)));
  const sizes = sizeSnapshots.map((sizeSnapshot) => sizeSnapshot.data().name).join(', ');
  return sizes;
}

//Получение типа товара из базы данных
async function getProductTypeName(productTypeRef) {
  const productTypeSnapshot = await getDoc(productTypeRef);
  const productTypeValue = productTypeSnapshot.data().name;
  return productTypeValue;
}

//Получение значения мужская/женская
async function getProductGenderName(genderTypeRef) {
  const genderTypeSnapshot = await getDoc(genderTypeRef);
  const genderTypeValue = genderTypeSnapshot.data().name;
  return genderTypeValue;
}

//Получение необходимых полей товара из snapshot
async function getProducts(snapshot){
  const promises = [];
  const neededData = [];

  snapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;
    const idColors = data.idColors;
    const idMaterial = data.idMaterial;
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
      idMaterial,
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

//Создаем блок товара по скидке
async function createSaleProductBlock(data, clothesList) {
  try {
    if(!data.isActivated){return;}
    const clothesBlock = document.createElement('div');
    clothesBlock.classList.add('keen-slider__slide');
    clothesBlock.innerHTML = `
        <blockquote class="clothContainer flex h-full flex-col justify-between p-2 shadow-sm sm:p-8 lg:p-12">
          <div class="p-8 m-4 rounded-lg hover:shadow-lg hover:bg-gray-800">
            <a class="overview group cursor-pointer relative mb-2 block h-96 overflow-hidden rounded-lg shadow-lg lg:mb-3">
              <div class="bg-white bg-opacity-50 absolute top-0 right-0 px-2 py-1"><p class="text-white fonr-normal text-base leading-4">${data.productSizes}</p></div>
              <img loading="lazy" class="productImage p-2 md:p-4 h-auto w-full mb-0 object-cover object-center justify-center items-center transition duration-200 group-hover:scale-110" src="images/o-T.png"/>
    
              <div class="absolute left-0 bottom-2 flex gap-2">
                <span class="discount rounded-r-lg bg-red-500 px-3 py-1.5 text-sm font-semibold uppercase tracking-wider text-white" hidden></span>
                <span class="isNew rounded-lg bg-white px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-gray-800" hidden></span>
              </div>
              <div class="bg-purple-400 bg-opacity-50 absolute bottom-0 right-0 px-2 py-1"><p class="text-white fonr-normal text-base leading-4">${data.productGender}</p></div>
            </a>
    
            <div class="flex items-start justify-between gap-2 px-2">
              <div class="flex flex-col">
                <a class="overviewName nameOne cursor-pointer text-lg font-bold text-white transition duration-100 hover:text-gray-500 lg:text-xl">${data.name}</a>
                <span class="clothTypeOne text-gray-500">${data.productType}</span>
              </div>
    
              <div class="flex flex-col items-end">
                <span class="priceOne font-bold text-gray-100 lg:text-lg"></span>
                <span class="discountPrice text-sm text-red-500 line-through"></span>
              </div>
            </div>
          </div>
        </blockquote>
    `;
    
    clothesList.appendChild(clothesBlock);
    const clothContainer = clothesBlock.querySelector('.clothContainer');
    const priceElement = clothesBlock.querySelector('.priceOne');
    const discountElement = clothesBlock.querySelector('.discount');
    const discountPriceElement = clothesBlock.querySelector('.discountPrice');
    const isNewElement = clothesBlock.querySelector('.isNew');
    const imageElement = clothesBlock.querySelector('.productImage'); 

    const imagePath = data.image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    imageElement.src = imageUrl;

    const price = data.price;
    const discount = data.discount;
    if(discount != 0){
      discountElement.textContent = `-${discount}%`;
      discountElement.hidden = false;

      discountPriceElement.textContent = `₽ ${price}`;
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

    clothContainer.hidden = false;

    clothesBlock.querySelector('.overview').addEventListener('click', () => {
      localStorage.setItem('lastProductId', data.id);
      window.location.href = 'product_overview.html';
    });
    clothesBlock.querySelector('.overviewName').addEventListener('click', () => {
      localStorage.setItem('lastProductId', data.id);
      window.location.href = 'product_overview.html';
    });

  } catch (error) {
    console.error("Error adding clothes:", error);
  }
}

//Рендер необходимых продуктов
async function renderSaleProducts(products) {

  const saleProductsList = document.querySelector('.saleProductsList');
  saleProductsList.innerHTML = ''; // Очищаем лист
  products.forEach((data) => {
    createSaleProductBlock(data, saleProductsList);
  });
}

//Получение товаров по скидке
async function filterProducts(){
  const productsCollection = collection(db, 'clothes');
  const q = query(productsCollection, where('discount', '>', 0));
  const productsSnapshot = await getDocs(q);
  return productsSnapshot;
}

//Получение количества товаров в корзине
async function getCartItemsCount(idUser){
  const cartQuery = query(cartCollection, where('idUser', '==', idUser));
  const querySnapshot = await getDocs(cartQuery);
  return querySnapshot.size;
}

const notEmptyCartBlock = document.getElementById('notEmptyCartBlock');
const emptyCartBlock = document.getElementById('emptyCartBlock');
const cartModalList = document.getElementById('cartModalList');

// Функция для обработки показа пустой корзины
function handleEmptyCart() {
  notEmptyCartBlock.hidden = true;
  emptyCartBlock.hidden = false;
}

// Функция для обработки непустой корзины
function handleNotEmptyCart() {
  notEmptyCartBlock.hidden = false;
  emptyCartBlock.hidden = true;
}

//Функция для показа уведомления пользователю
async function showAlert(title){
  let timerInterval;
      Swal.fire({
        title: title,
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
      }).then((result) => {
        /* Read more about handling dismissals below */
        if (result.dismiss === Swal.DismissReason.timer) {
          console.log("I was closed by the timer");
        }
      }); 
}

//Удаление товара из списка корзины меню
async function deleteFromCart(itemId){
  const shoppingCartRef = collection(db, 'shoppingCart');
  const itemDocRef = doc(shoppingCartRef, itemId);

  Swal.fire({
    title: "Вы уверены, что хотите удалить товар из корзины?",
    text: "Чтобы вернуть товар, необходимо добавить его в каталоге",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    cancelButtonText: "Отмена",
    confirmButtonText: "Да, удалить!"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await deleteDoc(itemDocRef);
        console.log('Документ успешно удален из корзины');
        showAlert("Удалено!");
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

      } catch (error) {
        console.log('Ошибка при удалении документа:', error);
        showAlert("Не удалось удалить товар из корзины!");
      }
    }
  });
}

//Добавление товара в список корзины меню
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
              <p class="discountPrice ml-4 text-sm text-red-500"></p>
            </div>
          </div>
          <div class="flex flex-1 items-end justify-between text-l">
            <p class="discount text-red-500"></p>

            <div class="flex">
              <button type="button" class="deleteFromCartButton font-medium text-purple-400 hover:text-purple-300">Удалить</button>
            </div>
          </div>
        </div>
      </li>
      `;
      const discountElement = cartModalBlock.querySelector('.discount');
      const discountPriceElement = cartModalBlock.querySelector('.discountPrice');
      const clothImage = cartModalBlock.querySelector('.Img');

      const price = productData.price;
      const discount = productData.discount;
      if(discount != 0){
        discountElement.textContent = `-${discount}%`;
        discountElement.hidden = false;
  
        discountPriceElement.textContent = `₽${Math.round(price * (100 - discount) / 100)}`;
      }else{
        discountPriceElement.textContent = `₽${price}`;
      }

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

//Функция, котороая создает элементы корзины товара
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

async function goToProfile(){
  if(_userId !== 'ALL') window.location.href = "user_profile.html"
  else{
    Swal.fire({
      title: "Вы не вошли в систему. Перейти на страницу аутентификации?",
      showCancelButton: true,
      confirmButtonText: "Перейти",
      cancelButtonText: "Отмена",
    }).then((result) => {
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

async function main() {
  const userId = await getUserId();
  _userId = userId;

  const saleProductsSnapshot = await filterProducts();
  console.log(saleProductsSnapshot)

  const productsData = await getProducts(saleProductsSnapshot);
  console.log(productsData)
  await renderSaleProducts(productsData);

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