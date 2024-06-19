import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, setDoc, addDoc, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import '../catalog.css';

import { Modal } from 'flowbite'


const $modalElement = document.getElementById('crud-modal');
const modal = new Modal($modalElement);




// Получение идентификатора пользователя из локального хранилища
async function getUserId(){
  try{
    const userId = localStorage.getItem('userId');
    if(userId === null){
      return 'ALL'
    }else return userId;
  }
  catch(error){
    return "ALL"
  }
}
const _userId = await getUserId();

let isClothes = true;
let isStyles = false;
let sortParameter = 'noSort';
let filteredStyles = [];

let selectedProducts = {
  '1': null,
  '2': null,
  '3': null,
  '4': null,
};;
const typeMappings = {
  '1': ['1', '3', '5', '7'],
  '2': ['2', '4', '6'],
  '3': ['8', '9', '10', '13'],
  '4': ['11']
};


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

const stylesCollection = collection(db, 'styles');
const clothesCollection = collection(db, 'clothes');
const stylesItemsQuery = query(stylesCollection, where('idUser', '==', 'ALL'));
const stylesSnapshot = await getDocs(stylesItemsQuery);
let stylesData = [];



async function getStyles(snapshot){

  const neededData = [];

  snapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;
    const name = data.name;
    const description = data.description;
    const price = data.price;
    const styleGender = data.styleGender;
    const idUser = data.idUser;
    const idClothes = data.idClothes;
    const image = data.image;
    const uses = data.uses;
    const createAt = data.createAt;

    neededData.push({
      id,
      name,
      description,
      price,
      styleGender,
      idUser,
      idClothes,
      image,
      uses,
      createAt
    });
  });

  return neededData;
}

async function getProductName(productId){
  const clothesCollection = collection(db, 'clothes');
  const docRef = doc(clothesCollection, productId);
  const docSnapshot = await getDoc(docRef);
  
  if (docSnapshot.exists()) {
    const productName = docSnapshot.data().name;
    return productName;
  } else {
    return ' ';
  }
}

async function getProductImage(productId){
  const clothesCollection = collection(db, 'clothes');
  const docRef = doc(clothesCollection, productId);
  const docSnapshot = await getDoc(docRef);
  
  if (docSnapshot.exists()) {
    const imagePath = docSnapshot.data().image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    return imageUrl;
  } else {
    return '';
  }
}

//Создаем Таблицу
async function createStylesTable(data, tableBody) {
  try {
    const newRow = document.createElement('tr');
    newRow.className = 'h-24 border-gray-400 dark:border-gray-300 border-b dark:text-gray-300 text-gray-700';
    newRow.hidden = true;

    // Populate the table row with data from Firestore
    newRow.innerHTML = `
    <td class="pl-8 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${data.id}</td>
    <td class="text-l pr-6 whitespace-no-wrap text-purple-700 dark:text-purple-500 tracking-normal leading-4">${data.name}</td>
    <td class="product1 pr-6 whitespace-no-wrap">
      <div class="flex items-center">
          <div class="h-8 w-8">
              <img class="productImage1 img h-full w-full overflow-hidden" hidden/>
          </div>
          <p class="productName1 ml-2 text-purple-600 dark:text-purple-400 tracking-normal leading-4 text-sm"></p>
      </div>
    </td>
    <td class="product2 pr-6 whitespace-no-wrap">
      <div class="flex items-center">
          <div class="h-8 w-8">
              <img class="productImage2 img h-full w-full overflow-hidden" hidden/>
          </div>
          <p class="productName2 ml-2 text-purple-600 dark:text-purple-400 tracking-normal leading-4 text-sm"></p>
      </div>
    </td>
    <td class="product3 pr-6 whitespace-no-wrap">
      <div class="flex items-center">
          <div class="h-8 w-8">
              <img class="productImage3 img h-full w-full overflow-hidden" hidden/>
          </div>
          <p class="productName3 ml-2 text-purple-600 dark:text-purple-400 tracking-normal leading-4 text-sm"></p>
      </div>
    </td>
    <td class="product4 pr-6 whitespace-no-wrap">
      <div class="flex items-center">
          <div class="h-8 w-8">
              <img class="productImage4 img h-full w-full overflow-hidden" hidden/>
          </div>
          <p class="productName4 ml-2 text-purple-600 dark:text-purple-400 tracking-normal leading-4 text-sm"></p>
      </div>
    </td>

    <td class="price text-sm pr-6 whitespace-no-wrap text-red-400 tracking-normal leading-4">${data.price} ₽</td>

    <td class="text-sm pr-6 whitespace-no-wrap tracking-normal leading-4">
      <div aria-label="documents" role="contentinfo" class="relative w-10 text-gray-100">
          <div class="absolute top-0 right-0 w-5 h-5 mr-2 -mt-1 rounded-full bg-indigo-700 text-white flex justify-center items-center text-xs">${data.uses}</div>
          <img class="dark:hidden" src="../images/purchase-white.svg" alt="icon-tabler-file">
          <img class="dark:block hidden text-gray-900 bg-gray-900" src="https://tuk-cdn.s3.amazonaws.com/can-uploader/compact_table_with_actions_and_select-svg8dark.svg" alt="icon-tabler-file">
      </div>
    </td>
    <td class="pr-6">
        <div class="styleGender w-2 h-2 rounded-full"></div>
    </td>
    <td class="pr-8 relative">
      <button aria-label="dropdown" role="button" class="dropbtn text-gray-500 rounded cursor-pointer border border-transparent  focus:outline-none focus:ring-2 focus:ring-offset-2  focus:ring-gray-400">
          <img src="https://tuk-cdn.s3.amazonaws.com/can-uploader/compact_table_with_actions_and_select-svg9.svg" alt="dropdown">
      </button>
      <div class="dropdown-content mt-1 absolute left-0 -ml-12 shadow-md z-10 hidden w-32">
          <ul class="bg-white dark:bg-gray-800 shadow rounded py-1">
              <button id="updateButton" role="button" aria-label="add table" class="text-left w-full text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-purple-500 hover:text-purple-400 px-3 font-normal">Изменить</button>
              <button id="deleteButton" class="text-left w-full cursor-pointer text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-red-500 hover:text-red-400 px-3 font-normal">Удалить</button>
          </ul>
      </div>
    </td>
    `;

    const products = data.idClothes;
    let index = 1;
    products.forEach(async(productId) => {
      const productName = await getProductName(productId);
      const productImage = await getProductImage(productId);
      newRow.querySelector(`.productName${index}`).textContent = productName;
      if(productImage !== ''){ newRow.querySelector(`.productImage${index}`).src = productImage; newRow.querySelector(`.productImage${index}`).hidden = false; }
      index += 1;
    });

    const productGenderElement = newRow.querySelector('.styleGender');
    if(data.styleGender == 'Мужской'){ productGenderElement.className = 'styleGender w-2 h-2 rounded-full bg-indigo-400';}
    else{productGenderElement.className = 'styleGender w-2 h-2 rounded-full bg-red-400';}

    // Append the new row to the table body
    tableBody.appendChild(newRow);
    newRow.hidden = false;

    const updateButton = newRow.querySelector('#updateButton');
    updateButton.addEventListener('click', async() => {
      await updateStyle(data);
    });


    const deleteButton = newRow.querySelector('#deleteButton');
    deleteButton.addEventListener('click', () => {
      const styletId = data.id;
      deleteStyle(styletId);
    });


    // Get the button element
    var button = newRow.querySelector('.dropbtn');
    // Get the dropdown content element
    var dropdownContent = newRow.querySelector('.dropdown-content');


    // Add a click event listener to the button
    button.addEventListener('click', function() {
      // Toggle the visibility of the dropdown content
      dropdownContent.classList.toggle('hidden');
    });

  } catch (error) {
    console.error(`Error showing product ${data.id}:`, error);
  }
}


//Рендерим все найденное
async function renderStyles(styles) {
  const stylesTableBody = document.getElementById('stylesTable');
  stylesTableBody.innerHTML = '';
  styles.forEach((data) => {
    createStylesTable(data, stylesTableBody);
  });
}

async function showColors(productColors){

  const selectedOptions = Array.from(productColors.selectedOptions).map(option => option.value);
  const modelColors = document.getElementById('modelColors');
  modelColors.innerHTML = '';
  const colorsContainer = document.createElement('div');
  colorsContainer.className = 'colorsContainer justify-center items-center';
  modelColors.appendChild(colorsContainer);
  const collectionRef = collection(db, 'colors');
  const querySnapshot = await getDocs(collectionRef); // Получаем все документы из коллекции 'colors'

  querySnapshot.forEach((colorDoc) => {
    if (selectedOptions.includes(colorDoc.id)) { // Проверяем, содержится ли id документа в выбранных опциях
      const color = colorDoc.data().hexColor;
      const colorButton = document.createElement('button');
      colorButton.className = 'justify-between shadow hover:shadow-lg w-8 h-8 rounded-full border border-white';
      colorButton.style.backgroundColor = color.trim();
      colorsContainer.appendChild(colorButton);
      colorButton.addEventListener('click', (event) => {
        event.preventDefault();
        setColor(color);
      });
    }
  });
}

async function getFirstColor(productColors){
  const selectedOptions = Array.from(productColors.selectedOptions).map(option => option.value);
  const firstColorValue = selectedOptions[0];
  const colorsCollection = collection(db, 'colors')
  const colorSnapshot = await getDoc(doc(colorsCollection, `${firstColorValue}`));
  return colorSnapshot.data().hexColor;
}

// Функция для определения позиции в selectedProducts на основе idClothType
function getPosition(idClothType) {
  for (const position in typeMappings) {
    if (typeMappings[position].includes(idClothType)) {
      return position;
    }
  }
  return null; // Если idClothType не найден в typeMappings
}

async function showSelectedStyleProducts(data, productType){
  const productImage = document.getElementById(`product${productType}Image`);
  const productName = document.getElementById(`product${productType}Name`);
  const productPrice = document.getElementById(`product${productType}Price`);

  productName.textContent = data.name;
  productPrice.textContent = data.price;
  const imageUrl = await getDownloadURL(ref(storage, `images/${data.image}.png`));
  productImage.src = imageUrl;
  const removeProductButton = document.getElementById(`removeProduct${productType}Button`);
  removeProductButton.hidden = false;
}

async function showSelectProducts(productsList, productType) {
  productsList.innerHTML = '';
  const typeImages = {
    '1': `../images/hudi.png`,
    '2': `../images/shtani.png`,
    '3': `../images/shapka.png`,
    '4': `../images/futbolka.png`,
  };
  const typeNames = {
    '1': `Верх..`,
    '2': `Низ..`,
    '3': `Головной убор..`,
    '4': `Аксессуар..`,
  };

  const types = typeMappings[productType] || [];

  const productsCollection = collection(db, 'clothes');
  const q = query(productsCollection, where('idClothType', 'in', types));
  const querySnapshot = await getDocs(q);

  const productImage = document.getElementById(`product${productType}Image`);
  const productName = document.getElementById(`product${productType}Name`);
  const productPrice = document.getElementById(`product${productType}Price`);
  const removeProductButton = document.getElementById(`removeProduct${productType}Button`);

  productImage.src = typeImages[productType];
  productName.textContent = typeNames[productType];
  productPrice.textContent = 'Цена';
  selectedProducts[productType] = null;
  removeProductButton.hidden = true;

  querySnapshot.forEach(async (doc) => {
    const data = doc.data();

    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.href = "#";
    link.classList.add("flex", "items-center", "px-4", "py-2", "hover:bg-gray-100", "dark:hover:bg-gray-600", "dark:hover:text-white");

    const image = document.createElement("img");
    const imageUrl = await getDownloadURL(ref(storage, `images/${data.image}.png`));
    image.src = imageUrl;
    image.classList.add("w-6", "h-6", "me-2", "rounded-full");
    image.alt = data.name;

    const name = document.createElement("span");
    name.textContent = data.name;

    link.appendChild(image);
    link.appendChild(name);
    listItem.appendChild(link);
    productsList.appendChild(listItem);

    listItem.addEventListener("click", () => {
      productImage.src = imageUrl;
      productName.textContent = data.name;
      productPrice.textContent = data.price;
      selectedProducts[productType] = doc.id;
      removeProductButton.hidden = false;
    });
    removeProductButton.addEventListener("click", () => {
      productImage.src = typeImages[productType];
      productName.textContent = typeNames[productType];
      productPrice.textContent = 'Цена';
      selectedProducts[productType] = null;
      removeProductButton.hidden = true;
    });
  });
}

async function updateStyle(data){
  try {
    const styleName = document.getElementById('name');
    const styleDescription = document.getElementById('description');
    const styleGender = document.getElementById('select_genderProduct');
    const stylePrice = document.getElementById('price');
    const styleImage = document.getElementById('product_image');
    const styleImageName = document.getElementById('image_name');
    const styleProduct1List = document.getElementById('products1List');
    const styleProduct2List = document.getElementById('products2List');
    const styleProduct3List = document.getElementById('products3List');
    const styleProduct4List = document.getElementById('products4List');

    await showSelectProducts(styleProduct1List, '1');
    await showSelectProducts(styleProduct2List, '2');
    await showSelectProducts(styleProduct3List, '3');
    await showSelectProducts(styleProduct4List, '4');

    styleName.value = '';
    styleDescription.value = '';
    styleGender.value = 'Мужской';
    stylePrice.value = '';
    styleImageName.value = '';
    styleImage.src = `../images/modalMenuClothes.png`;

    
    modal.show();

    if(data !== null) {
      styleName.value = data.name;
      styleDescription.value = data.description;
      stylePrice.value = data.price;

      styleGender.value = data.styleGender;

      const imagePath = data.image;
      const storageImageRef = ref(storage, `images/${imagePath}`);
      const imageUrl = await getDownloadURL(storageImageRef);
      styleImage.src = imageUrl;
      styleImageName.value = imagePath;

      const idClothesArray = data.idClothes; // Получаем массив idClothes из data
      idClothesArray.forEach(async(idCloth) => {
        const docRef = doc(db, 'clothes', idCloth);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        const idClothType = data.idClothType;
        const position = getPosition(idClothType); // Используем функцию getPosition из предыдущего ответа
        if (position) {
          selectedProducts[position] = idCloth;
          await showSelectedStyleProducts(data, position);
        }
      });
    }



    const imageInput = document.getElementById('file-upload');
    imageInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.addEventListener('load', (readerEvent) => {
          styleImage.src = readerEvent.target.result;
        });
        reader.readAsDataURL(file);
      }
      styleImageName.value = file.name;
    });


    const saveButton = document.getElementById('saveButton');
    saveButton.addEventListener('click', async(event) => {
      event.preventDefault();
      
      const imageFileName = styleImageName.value;

      const selectedFile = imageInput.files[0];
      if(selectedFile){
        const fullFileName = selectedFile.name;
        const storageRef = ref(storage, `images/${fullFileName}`);
        await uploadBytes(storageRef, selectedFile);
      }


      let uses = '0';

      const date = new Date();
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      let styleCreateAt = `${month}.${day}.${year}`;

      if(data !== null){
        uses = data.uses;
        styleCreateAt = data.createAt;
      }

      const style = {
        name: styleName.value,
        description: styleDescription.value,
        price: parseFloat(stylePrice.value),
        styleGender: styleGender.value,
        idClothes: Array.from(Object.values(selectedProducts)).filter(value => value !== null),
        image: imageFileName,
        idUser: 'ALL',
        uses: uses,
        createAt: styleCreateAt,
      };
      console.log(style);

      if(data === null){
        try {
          await addDoc(stylesCollection, style)
          Swal.fire({
            icon: "success",
            title: "Добавлено!",
            text: "Стиль был успешно добавлен.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const stylesSnapshot = await getDocs(stylesCollection);
            stylesData = await getStyles(stylesSnapshot);
            await renderStyles(stylesData);
            modal.hide();
          }, 2000);
        }
        catch (error) {
          console.error(`Error adding new style:`, error);
        }
      }
      else if (data !== null){
        // Update the document in the "clothes" collection with the selected color and size IDs
        const docRef = doc(db, 'styles', data.id);
        updateDoc(docRef, style);
        Swal.fire({
          icon: "success",
          title: "Изменено!",
          text: "Данные стиля были успешно изменены.",
          showConfirmButton: false,
          timer: 1500
        });
        setTimeout(async function() {
          data = null;
          const stylesSnapshot = await getDocs(stylesCollection);
          stylesData = await getStyles(stylesSnapshot);
          await renderStyles(stylesData);
          modal.hide();
        }, 2000);
      }
    });

  } catch (error) {
    console.error(`Error updating style:`, error);
  }
}



async function deleteStyle(styleId){
  try {
    Swal.fire({
      title: "Вы уверены, что хотите удалить стиль?",
      text: "Чтобы вернуть его, вам придется заново заполнить все поля",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, удалить!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const styleDoc = doc(stylesCollection, styleId);
          // Удаляем документ из коллекции "styles" в Firestore
          await deleteDoc(styleDoc);

          Swal.fire({
            icon: "success",
            title: "Удалено!",
            text: "Стиль был успешно удален.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const stylesSnapshot = await getDocs(stylesCollection);
            stylesData = await getStyles(stylesSnapshot);
            await renderStyles(stylesData);
          }, 2000);
        } catch (error) {
          console.error("Ошибка при удалении стиля:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при удалении стиля.",
            icon: "error"
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error deleting style ${styleId}:`, error);
  }
}



const productGender = document.getElementById('select_genderProduct');
productGender.addEventListener('change', function() {
    if(productGender.value == 1){loadMannequin('Мужская');}
    else if(productGender.value == 2){loadMannequin('Женская');}
});


const addStyleButton = document.getElementById('addStyleButton');
addStyleButton.addEventListener('click', async function() {
  await updateStyle(null);
});


async function searchStyles(text) {
  const searchText = text.toLowerCase();
  const processedText = searchText
    .split('')
    .map((char, index) =>
      index === 0 ? char.toUpperCase() : char
    )
    .join('');
  const start = processedText;
  const end = processedText + '\uf8ff';

  const stylesCollection = collection(db, 'styles');
  const stylesItemsQuery = query(
    stylesCollection,
    where('name', '>=', start),
    where('name', '<=', end),
    where('idUser', '==', 'ALL')
  );

  const querySnapshot = await getDocs(stylesItemsQuery);
  filteredStyles = await getStyles(querySnapshot);

  await renderStyles(filteredStyles);
}

const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
// Добавляем обработчик события на поле ввода
searchInput.addEventListener('keydown', function(event) {
  // Проверяем, нажата ли клавиша Enter
  if (event.key === 'Enter') {
    // Вызываем функцию search()
    searchStyles(searchInput.value);
  }
});
searchButton.addEventListener('click', (event) => {
  event.preventDefault();
  searchStyles(searchInput.value);
})

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
  stylesData = await getStyles(stylesSnapshot);
  await renderStyles(stylesData);
  filteredStyles = stylesData;

  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add("hidden");

  await getCartItemsCount(_userId).then(count => {
    console.log(`Количество документов с idUser ${_userId}: ${count}`);
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

main()