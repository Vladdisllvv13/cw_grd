import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, setDoc, addDoc, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { Modal } from 'flowbite'

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

const clothesCollection = collection(db, 'clothes');
const ordersCollection = collection(db, 'orders');

let selectedProducts = {};
let finalSum = 0;

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


const $modalElement = document.getElementById('crud-modal');
const modal = new Modal($modalElement);

async function getProductOptions(refs){
  const array = [];
  const snapshots = await Promise.all(refs.map((ref) => getDoc(ref)));
  snapshots.map((snapshot) => array.push(snapshot.data().name));
  return array;
}


async function createOrderProductBlock(list, product, size, color, quantity, productId){
  try {
    selectedProducts = Object.assign(selectedProducts, {
      [productId]: {
        size,
        color,
        quantity
      }
    });

    finalSum += product.price;
    const orderPrice = document.getElementById('price');
    orderPrice.value = finalSum;

    const newItem = document.createElement('div');
    newItem.hidden = true;
  
    // Populate the table row with data from Firestore
    newItem.innerHTML = `
      <div class="relative group bg-gray-300 py-10 sm:py-20 px-4 flex flex-col space-y-2 items-center rounded-md">
      <div class="relative flex items-center justify-center group-hover:scale-110 transition-transform">
        <div class="block absolute w-48 h-48 bottom-0 left-0 -mb-24"
            style="background: radial-gradient(black, transparent 60%); transform: rotate3d(0, 0, 1, 20deg) scale3d(1, 0.6, 1); opacity: 0.2;">
        </div>
        <img class="productImage relative w-28 h-28"  alt="">
      </div>
      <p class="text-gray-800">Футболка</p>
      <h4 class="text-purple-600 text-2xl font-bold capitalize text-center">${product.name}</h4>
      <select required class="colors bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
        <option selected>Выберите цвет</option>
      </select>
      <select required class="sizes bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
        <option selected>Выберите размер</option>
      </select>
      <select required class="quantities bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
        <option selected>Выберите количество</option>
        <option value=1>1</option>
        <option value=2>2</option>
        <option value=3>3</option>
        <option value=4>4</option>
        <option value=5>5</option>
      </select>
      <p class="gender absolute top-2 text-gray-700 inline-flex items-center text-xs">Мужская <span class="ml-2 w-2 h-2 block bg-blue-500 rounded-full group-hover:animate-pulse"></span></p>
      <p class="absolute bottom-4 right-4 text-red-500 inline-flex items-center text-xl">${product.price} ₽</p>
      <button type="button" class="removeButton cursor-pointer absolute top-0 right-0 mt-2 mr-2 text-white">
        <img src="../images/delete-style-product.svg" alt="Корзина" class="w-6 h-6">
      </button>
    </div>
    `;
    const imageElement = newItem.querySelector('.productImage');
    const imagePath = product.image;
    const storageImageRef = ref(storage, `images/${imagePath}.png`);
    const imageUrl = await getDownloadURL(storageImageRef);
    imageElement.src = imageUrl;

    if(product.idClothTypeGender == '1'){newItem.querySelector('.gender').innerHTML = `Мужская <span class="ml-2 w-2 h-2 block bg-blue-500 rounded-full group-hover:animate-pulse"></span>`}
    else if(product.idClothTypeGender == '2'){newItem.querySelector('.gender').innerHTML = `Женская <span class="ml-2 w-2 h-2 block bg-pink-500 rounded-full group-hover:animate-pulse"></span>`}

    const sizesSelect = newItem.querySelector('.sizes');
    const sizesIds = product.idSizes.map((sizeId) => doc(db, 'sizes', sizeId.toString()));
    const sizes = await getProductOptions(sizesIds);
    sizes.forEach((sizeValue) => {
      const option = document.createElement('option');
      option.value = sizeValue;
      option.text = sizeValue;
      if(sizeValue === size){option.selected = true}
      sizesSelect.appendChild(option);
    });

    const colorsSelect = newItem.querySelector('.colors');
    const colorsIds = product.idColors.map((colorId) => doc(db, 'colors', colorId.toString()));
    const colors = await getProductOptions(colorsIds);
    colors.forEach((colorValue) => {
      const option = document.createElement('option');
      option.value = colorValue;
      option.text = colorValue;
      if(colorValue === color){option.selected = true}
      colorsSelect.appendChild(option);
    });

    const quantitiesSelect = newItem.querySelector('.quantities');
    const options = quantitiesSelect.options;
    for (let i = 0; i < options.length; i++) {
      console.log(`${quantity}       ${options[i].value}`)
      if (parseInt(options[i].value) === quantity) {
        options[i].selected = true;
      }
    }

    sizesSelect.addEventListener('change', function() {
      size = this.value;
      selectedProducts = Object.assign({}, selectedProducts, {
        [productId]: {
          size: size,
          color: color,
          quantity: quantity
        }
      });
      console.log(selectedProducts);
    });
    colorsSelect.addEventListener('change', function() {
      color = this.value;
      selectedProducts = Object.assign({}, selectedProducts, {
        [productId]: {
          size: size,
          color: color,
          quantity: quantity
        }
      });
      console.log(selectedProducts);
    });
    quantitiesSelect.addEventListener('change', function() {
      quantity = parseInt(this.value);
      selectedProducts = Object.assign({}, selectedProducts, {
        [productId]: {
          size: size,
          color: color,
          quantity: quantity
        }
      });
      console.log(selectedProducts);
    });

    const removeButton = newItem.querySelector('.removeButton');
    removeButton.addEventListener('click', function() {
      delete selectedProducts[productId];
      const parent = newItem.parentNode;
      parent.removeChild(newItem);

      finalSum -= product.price;
      orderPrice.value = finalSum;

      console.log(selectedProducts);
    });

    list.appendChild(newItem);
    newItem.hidden = false;

  } catch (error) {
    console.error(`Error showing product ${product.name}:`, error);
  }
}

async function renderProducts(products, clothesSnapshots) {
  const orderProductsList = document.getElementById('orderProductsList');
  orderProductsList.innerHTML = '';

  clothesSnapshots.forEach(async(clothesSnapshot, index) => {
    if (clothesSnapshot.exists()) {
      const product = clothesSnapshot.data();
      const id = clothesSnapshot.id;
      const { size, color, quantity } = products[Object.keys(products)[index]];


      await createOrderProductBlock(orderProductsList, product, size, color, quantity, id)

    } else {
      console.log(`Документ с идентификатором ${Object.keys(products)[index]} не найден в коллекции clothes`);
    }
  });
}

async function getProductsFromClothesCollection(productsData) {
  const clothesCollection = collection(db, 'clothes');
  const clothesDocRefs = Object.keys(productsData).map(productId => doc(clothesCollection, productId));
  const clothesSnapshots = await Promise.all(clothesDocRefs.map(docRef => getDoc(docRef)));

  return clothesSnapshots;
}

function generateCode() {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  const random = arr[0] % (charset.length + 1);
  return `${charset.charAt(random)}-${Array(8).fill(0).map(() => charset.charAt(Math.floor(Math.random() * charset.length))).join("")}`;
}


async function updateOrder(data){
  try {
    finalSum = 0;
    selectedProducts = {};

    const orderCode = document.getElementById('code');
    const orderDate = document.getElementById('date');
    const orderSurname = document.getElementById('surname');
    const orderName = document.getElementById('name');
    const orderEmail = document.getElementById('email');
    const orderPhone = document.getElementById('phone');
    const orderTypeSelect = document.getElementById('orderTypeSelect');
    const addressInput = document.getElementById('addressInput');
    const pickUpPointSelect = document.getElementById('pickUpPointSelect');
    const orderPrice = document.getElementById('price');
    const radios = document.getElementsByName('list-radio');
    const orderProductsList = document.getElementById('orderProductsList');

    orderCode.value = '';
    orderDate.value = '';
    orderSurname.value = '';
    orderName.value = '';
    orderEmail.value = '';
    orderPhone.value = '';
    orderTypeSelect.value = 'Доставка';
    orderPhone.value = '';
    addressInput.value = '';
    pickUpPointSelect.value = 'Пункт 1';
    orderPrice.value = finalSum;
    orderProductsList.innerHTML = '';

    addressInput.disabled = false;
    addressInput.required = true;
    pickUpPointSelect.disabled = true;
    pickUpPointSelect.required = false;

    for (const radio of radios) {
        if (radio.id === 'horizontal-list-radio-license') {
            radio.checked = true;
            break;
        }
    }

    if(data === null){
      orderCode.value = generateCode();
    }

    if(data !== null) {
      orderCode.value = data.code;
      orderDate.value = data.date;
      orderSurname.value = data.surname;
      orderName.value = data.name;
      orderEmail.value = data.email;
      orderPhone.value = data.phone;
      orderTypeSelect.value = data.orderType;

      // Получаем выбранное значение
      const selectedValue = data.orderType;

      // Проверяем выбранное значение и изменяем состояние элементов
      if (selectedValue === 'Доставка') {
        addressInput.disabled = false;
        addressInput.required = true;
        pickUpPointSelect.disabled = true;
        pickUpPointSelect.required = false;
      } else if (selectedValue === 'Пункт выдачи') {
        addressInput.disabled = true;
        addressInput.required = false;
        pickUpPointSelect.disabled = false;
        pickUpPointSelect.required = true;
      }

      const orderTypeValue = orderTypeSelect.value;
      if (orderTypeValue === 'Доставка') {addressInput.value = data.address;} 
      else if (orderTypeValue === 'Пункт выдачи') {pickUpPointSelect.value = data.address;}

      for (const radio of radios) {
        if (radio.value === data.status) {
            radio.checked = true;
            break;
        }
      }

      const products = data.products;
      const clothesSnapshots = await getProductsFromClothesCollection(products);
      await renderProducts(products, clothesSnapshots);
    }

    modal.show();

    const saveButton = document.getElementById('saveButton');
    saveButton.addEventListener('click', async(event) => {
      event.preventDefault();

      // Получаем выбранное значение
      const selectedValue = orderTypeSelect.value;
      let address = '';
      if (selectedValue === 'Доставка') {
        address = addressInput.value;
      } else if (selectedValue === 'Пункт выдачи') {
        address = pickUpPointSelect.value;
      }

      let status = 'В обработке';
      for (const radio of radios) {
        if (radio.checked) {
          status = radio.value;
          break;
        }
      }

      const newOrder = {
        surname: orderSurname.value,
        name: orderName.value,
        email: orderEmail.value,
        phone: orderPhone.value,
        products: selectedProducts,
        price: parseFloat(orderPrice.value),
        orderType: orderTypeSelect.value,
        address: address,
        date: orderDate.value,
        code: orderCode.value,
        status: status
      };
      
      console.log(newOrder)
      if(data === null){
        try {
          await addDoc(ordersCollection, newOrder)
          Swal.fire({
            icon: "success",
            title: "Добавлено!",
            text: "Заказ был успешно добавлен.",
            showConfirmButton: true,
          });
          setTimeout(async function() {
            const ordersSnapshot = await getDocs(ordersCollection);
            const orders = await getOrders(ordersSnapshot);
            renderOrders(orders);
            modal.hide();
          }, 2000);
        }
        catch (error) {
          console.error(`Error adding new order:`, error);
        }
      }
      else if (data !== null){
        // Update the document in the "clothes" collection with the selected color and size IDs
        const docRef = doc(db, 'orders', data.id);
        updateDoc(docRef, newOrder);
        Swal.fire({
          icon: "success",
          title: "Изменено!",
          text: "Данные заказа были успешно изменены.",
          showConfirmButton: true,
        });
        setTimeout(async function() {
          const ordersSnapshot = await getDocs(ordersCollection);
          const orders = await getOrders(ordersSnapshot);
          renderOrders(orders);
          modal.hide();
        }, 2000);
      }
      data = null;
    });

    


  } catch (error) {
    console.error(`Error updating order:`, error);
  }
}

async function getOrders(snapshot){
  const neededData = [];

  snapshot.forEach((document) => {
    const data = document.data();
    const id = document.id;
    const code = data.code;
    const products = data.products;
    const date = data.date;
    const orderType = data.orderType;
    const address = data.address;
    const surname = data.surname;
    const name = data.name;
    const email = data.email;
    const phone = data.phone;
    const price = data.price;
    const status = data.status;

    neededData.push({
      id,
      code,
      products,
      surname,
      name,
      email,
      phone,
      date,
      orderType,
      address,
      price,
      status
    });
  });

  return neededData;
}

//Создаем Таблицу
async function createOrdersRow(data, tableBody) {
  try {
    const newRow = document.createElement('tr');
    newRow.className = 'h-24 border-gray-400 dark:border-gray-300 border-b dark:text-gray-300 text-gray-700';
    newRow.hidden = true;

  
    // Populate the table row with data from Firestore
    newRow.innerHTML = `
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${data.id}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap text-purple-400 dark:text-gray-100 tracking-normal leading-4">${data.code}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${data.surname}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${data.name}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${data.orderType}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${data.address}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${data.email}</td>
    <td class="pl-4 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">${data.phone}</td>
    <td class="price text-sm pr-6 whitespace-no-wrap text-red-400 tracking-normal leading-4">${data.price} ₽</td>
    
    <td class="status pl-4 text-sm pr-6 whitespace-no-wrap dark:text-gray-100 tracking-normal leading-4">
      <dd class=" me-2 mt-1.5 inline-flex items-center rounded bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-900 dark:text-purple-300">
        <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 4h-13m13 16h-13M8 20v-3.333a2 2 0 0 1 .4-1.2L10 12.6a1 1 0 0 0 0-1.2L8.4 8.533a2 2 0 0 1-.4-1.2V4h8v3.333a2 2 0 0 1-.4 1.2L13.957 11.4a1 1 0 0 0 0 1.2l1.643 2.867a2 2 0 0 1 .4 1.2V20H8Z" />
        </svg>
        ${data.status}
      </dd>
    </td>

    <td class="pr-8 relative">
      <button aria-label="dropdown" role="button" class="dropbtn text-gray-500 rounded cursor-pointer border border-transparent  focus:outline-none focus:ring-2 focus:ring-offset-2  focus:ring-gray-400">
          <img src="https://tuk-cdn.s3.amazonaws.com/can-uploader/compact_table_with_actions_and_select-svg9.svg" alt="dropdown">
      </button>
      <div class="dropdown-content mt-1 absolute left-0 -ml-12 shadow-md z-10 hidden w-32">
          <ul class="bg-white dark:bg-gray-800 shadow rounded py-1">
              <button id="updateButton" role="button" aria-label="add table" class="text-left w-full text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-purple-500 hover:text-purple-400 px-3 font-normal">Изменить</button>
              <button id="deleteButton" class="text-left w-full cursor-pointer text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-red-500 hover:text-red-400 px-3 font-normal">Удалить</button>
              <button hidden class="orderButton text-left w-full cursor-pointer text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-indigo-400 hover:text-indigo-300 px-3 font-normal">Восстановить</button>
              <button class="cancelButton text-left w-full cursor-pointer text-sm leading-3 tracking-normal py-3 hover:bg-indigo-500 text-red-400 hover:text-red-300 px-3 font-normal">Отменить</button>
          </ul>
      </div>
    </td>
    `;
    const cancelButton = newRow.querySelector(`.cancelButton`);
    const orderButton = newRow.querySelector(`.orderButton`);

    let statusHtml = ``;
    if(data.status === 'В обработке'){
      statusHtml = `
      <dd class=" me-2 mt-1.5 inline-flex items-center rounded bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-900 dark:text-purple-300">
      <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 4h-13m13 16h-13M8 20v-3.333a2 2 0 0 1 .4-1.2L10 12.6a1 1 0 0 0 0-1.2L8.4 8.533a2 2 0 0 1-.4-1.2V4h8v3.333a2 2 0 0 1-.4 1.2L13.957 11.4a1 1 0 0 0 0 1.2l1.643 2.867a2 2 0 0 1 .4 1.2V20H8Z" />
      </svg>
      ${data.status}
    </dd>`
    }
    else if(data.status === 'Отменен'){
      cancelButton.hidden = true;
      orderButton.hidden = false;

      statusHtml = `
      <dd class="me-2 mt-1.5 inline-flex items-center rounded bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
      <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6" />
      </svg>
      ${data.status}
    </dd>`
    }
    else if(data.status === 'Выполнен'){
      statusHtml = `
      <dd class="me-2 mt-1.5 inline-flex items-center rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
        <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5" />
        </svg>
        ${data.status}
      </dd>`
    }
    else if(data.status === 'В ожидании'){
      statusHtml = `
      <dd class="me-2 mt-1.5 inline-flex items-center rounded bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
        <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
        </svg>
        ${data.status}
      </dd>`
    }
    const statusCol = newRow.querySelector(`.status`);
    statusCol.innerHTML = statusHtml;

    // Append the new row to the table body
    tableBody.appendChild(newRow);
    newRow.hidden = false;

    const updateButton = newRow.querySelector('#updateButton');
    updateButton.addEventListener('click', async() => {
      await updateOrder(data);
    });


    const deleteButton = newRow.querySelector('#deleteButton');
    deleteButton.addEventListener('click', () => {
      const orderId = data.id;
      deleteOrder(orderId);
    });

    cancelButton.addEventListener('click', () => {
      const orderId = data.id;
      cancelOrder(orderId);
    });

    orderButton.addEventListener('click', () => {
      const orderId = data.id;
      recoverOrder(orderId);
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

async function renderOrders(orders){
  const ordersTable = document.getElementById('ordersTable');
  //const emptyTable = document.getElementById('emptyTable');
  ordersTable.hidden = false;
  //emptyTable.hidden = true;

  ordersTable.innerHTML = '';

  orders.forEach((data) => {
    createOrdersRow(data, ordersTable);
  });
}

async function showSelectProducts(productsList) {
  const productItem = document.createElement('div');
 
  const productsCollection = collection(db, 'clothes');
  const querySnapshot = await getDocs(productsCollection);

  querySnapshot.forEach(async (doc) => {
    const data = doc.data();
    const id = doc.id;
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
    productItem.appendChild(listItem);

    listItem.addEventListener("click", () => {
      const orderProductsList = document.getElementById('orderProductsList');
      createOrderProductBlock(orderProductsList, data, null, null, null, id);
    });
  });
  productsList.innerHTML = '';
  productsList.appendChild(productItem);
}

async function cancelOrder(orderId){
  try {
    Swal.fire({
      title: "Вы уверены, что хотите отменить заказ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, отменить!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const orderDoc = doc(ordersCollection, orderId);
          await updateDoc(orderDoc, { status: 'Отменен' });

          Swal.fire({
            icon: "success",
            title: "Отменен!",
            text: "Заказ был успешно отменен.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const ordersSnapshot = await getDocs(ordersCollection);
            const orders = await getOrders(ordersSnapshot);
            renderOrders(orders);
          }, 2000);
        } catch (error) {
          console.error("Ошибка при отмене заказа:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при отмене заказа.",
            icon: "error"
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error cancel order ${orderId}:`, error);
  }
}

async function recoverOrder(orderId){
  try {
    Swal.fire({
      title: "Восстановить заказ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, восстановить!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const orderDoc = doc(ordersCollection, orderId);
          await updateDoc(orderDoc, { status: 'В обработке' });

          Swal.fire({
            icon: "success",
            title: "Восстановлено!",
            text: "Заказ был успешно восстановлен.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const ordersSnapshot = await getDocs(ordersCollection);
            const orders = await getOrders(ordersSnapshot);
            renderOrders(orders);
          }, 2000);
        } catch (error) {
          console.error("Ошибка при восстановлении заказа:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при восстановлении заказа.",
            icon: "error"
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error recovering order ${orderId}:`, error);
  }
}

async function deleteOrder(orderId){
  try {
    Swal.fire({
      title: "Вы уверены, что хотите удалить заказ?",
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
          const orderDoc = doc(ordersCollection, orderId);
          // Удаляем документ из коллекции "orders" в Firestore
          await deleteDoc(orderDoc);

          Swal.fire({
            icon: "success",
            title: "Удалено!",
            text: "Заказ был успешно удален.",
            showConfirmButton: false,
            timer: 1500
          });
          setTimeout(async function() {
            const ordersSnapshot = await getDocs(ordersCollection);
            const orders = await getOrders(ordersSnapshot);
            renderOrders(orders);
          }, 2000);
        } catch (error) {
          console.error("Ошибка при удалении заказа:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при удалении заказа.",
            icon: "error"
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error deleting order ${orderId}:`, error);
  }
}

async function searchOrders(text) {
  const searchText = text.toLowerCase();
  const processedText = searchText
    .split('')
    .map((char, index) => index === 0 ? char.toUpperCase() : char)
    .join('');

  const start = processedText;
  const end = processedText + '\uf8ff';

  const ordersCollection = collection(db, 'orders');
  const ordersItemsQuery = query(
    ordersCollection,
    where('code', '>=', start),
    where('code', '<=', end)
  );

  const ordersSnapshot = await getDocs(ordersItemsQuery);
  const orders = await getOrders(ordersSnapshot);
  renderOrders(orders);
}

const orderTypeSelect = document.getElementById('orderTypeSelect');
const addressInput = document.getElementById('addressInput');
const pickUpPointSelect = document.getElementById('pickUpPointSelect');
// Добавляем обработчик события change на селект orderTypeSelect
orderTypeSelect.addEventListener('change', function() {
  // Получаем выбранное значение
  const selectedValue = this.value;

  // Проверяем выбранное значение и изменяем состояние элементов
  if (selectedValue === 'Доставка') {
    addressInput.disabled = false;
    addressInput.required = true;
    pickUpPointSelect.disabled = true;
    pickUpPointSelect.required = false;
  } else if (selectedValue === 'Пункт выдачи') {
    addressInput.disabled = true;
    addressInput.required = false;
    pickUpPointSelect.disabled = false;
    pickUpPointSelect.required = true;
  }
});

const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
// Добавляем обработчик события на поле ввода
searchInput.addEventListener('keydown', function(event) {
  // Проверяем, нажата ли клавиша Enter
  if (event.key === 'Enter') {
    // Вызываем функцию search()
    searchOrders(searchInput.value);
  }
});
searchButton.addEventListener('click', (event) => {
  event.preventDefault();
  searchOrders(searchInput.value);
})

const addOrderButton = document.getElementById('addOrderButton');
addOrderButton.addEventListener('click', async function(event) {
  event.preventDefault();
  await updateOrder(null);
});

const dropdownProductsButton = document.getElementById('dropdownProductsButton');
dropdownProductsButton.addEventListener('click', async function(event) {
  event.preventDefault();
  const productsList = document.getElementById('productsList');
  await showSelectProducts(productsList);
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
  const ordersSnapshot = await getDocs(ordersCollection);
  const orders = await getOrders(ordersSnapshot);
  renderOrders(orders);

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