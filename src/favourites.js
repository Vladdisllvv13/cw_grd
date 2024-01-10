import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, addDoc, query, where } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import './catalog.css';

// Получите идентификатор пользователя из локального хранилища
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
const clothesSnapshot = await getDocs(clothesCollection);
const clothesData = [];
let userClothesData = [];
let userStylesData = [];




const exitButton = document.getElementById('exitButton');
exitButton.addEventListener('click', function() {
    localStorage.setItem('userId', 'ALL');
    exitButton.hidden = true;
    location.reload();

});





//Получаем данные об одежде и записываем в clothesData
clothesSnapshot.forEach((document) => {
    const data = document.data();
    const sizeRefs = data.idSizes.map((sizeId) => doc(db, 'sizes', sizeId.toString()));
    const nameRef = doc(clothesCollection, document.id);
    const imageRef = doc(clothesCollection, document.id);
    const priceRef = doc(clothesCollection, document.id);
    const clothTypeRef = doc(db, 'clothType', data.idClothType.toString());
    const clothTypeGenderRef = doc(db, 'clothTypeGender', data.idClothTypeGender.toString());
    const colorsRef = data.idColors.map((colorId) => doc(db, 'colors', colorId.toString()));
    clothesData.push({
      sizeRefs,
      nameRef,
      imageRef,
      priceRef,
      clothTypeRef,
      colorsRef,
      clothTypeGenderRef
    });
  });

// Получаем данные о пользователе
const userCollection = collection(db, 'users');
const userId = await getUserId()
console.log(userId);

if(userId !== 'ALL'){
  exitButton.hidden = false;
}
else window.location.href = "catalog.html";

const userSnapshot = await getDoc(doc(userCollection, `${userId}`)); // Замените '1' на идентификатор пользователя, для которого вы хотите отобразить одежду
const userData = userSnapshot.data();

// Преобразуем идентификаторы в строковый формат
const userFavouritesIds = userData.idFavourites.map(String);
// Фильтруем данные об одежде по идентификаторам из коллекции clothes
userClothesData = clothesData.filter((cloth) => userFavouritesIds.includes(cloth.nameRef.id));
console.log(userClothesData);



//Создаем ClothData
async function createClothBlock(data, list) {
  try {
    let isFavourite = false;
    let imageUrl;
    const clothesList = document.getElementById(list);
    const clothesBlock = document.createElement('div');
    clothesBlock.className = "p-4 flex flex-shrink-0 justify-center items-center mb-4";
    clothesBlock.classList.add('inline-flex');
    clothesBlock.innerHTML = `
      <div class="imageContainerClothesOne720x400 bg-gray-100 p-6 rounded-lg border border-gray-950 shadow hover:shadow-lg">
        <img class="object-scale-down h-40 rounded w-40 object-center mb-6" src="" alt="content">
        <h3 class="sizesOne tracking-widest text-purple-500 text-xs font-medium title-font"></h3>
        <h1 class="clothTypeOne text-lg text-gray-900 font-medium title-font"></h4>
        <h5 class="nameOne text-lg text-2xl text-gray-900 font-medium title-font"></h5>

        <div class="flex items-end mb-4">
          <h5 class="priceOne text-lg text-3xl font-bold font-medium text-purple-800 title-font"></h5>
          <svg class="h-8 w-8 fill-current text-gray-500 hover:text-black ml-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path id="heartIcon" d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="#4f4f4f"/>
          </svg>  
        </div>
        
        <div class="colorsOne flex mb-4"></div>
        <div class="flex items-stretch">
          <button id="moreButton" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l">
            Больше
          </button>
          <button id="addToWardrobeButton" class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-r">
            В гардероб
          </button>
        </div>
      </div>`;
    clothesList.appendChild(clothesBlock);
    const clothTypeElement = clothesBlock.querySelector('.clothTypeOne');
    const nameElement = clothesBlock.querySelector('.nameOne');
    const priceElement = clothesBlock.querySelector('.priceOne');
    const sizesElement = clothesBlock.querySelector('.sizesOne');
    const imageElement = clothesBlock.querySelector('.imageContainerClothesOne720x400 img'); 
    const colorsElement = clothesBlock.querySelector('.colorsOne');

    if (clothTypeElement && nameElement && sizesElement && imageElement && colorsElement && priceElement) {
      const clothTypeSnapshot = await getDoc(data.clothTypeRef);
      const clothTypeValue = clothTypeSnapshot.data().name;
      const clothTypeGenderSnapshot = await getDoc(data.clothTypeGenderRef);
      const clothTypeGenderValue = clothTypeGenderSnapshot.data().name;
      const nameSnapshot = await getDoc(data.nameRef); // Fetch the document snapshot
      const priceSnapshot = await getDoc(data.priceRef);
      const sizeSnapshots = await Promise.all(data.sizeRefs.map((sizeRef) => getDoc(sizeRef)));
      const sizeValues = sizeSnapshots.map((sizeSnapshot) => sizeSnapshot.data().name).join(', ');
      const colorsSnapshots = await Promise.all(data.colorsRef.map((colorRef) => getDoc(colorRef)));
      const colorsValues = colorsSnapshots.map((colorSnapshot) => colorSnapshot.data().hexColor).join(', ');

      const imagePathSnapshot = await getDoc(data.imageRef);
      const imagePath = imagePathSnapshot.data().image;
      if (imagePath) {
        const storageImageRef = ref(storage, `images/${imagePath}.jpg`);
        imageUrl = await getDownloadURL(storageImageRef);
        imageElement.src = imageUrl;
      }
      clothTypeElement.textContent = `${clothTypeValue} (${clothTypeGenderValue[0]})`;
      nameElement.textContent = nameSnapshot.data().name; // Access the data from the snapshot
      priceElement.textContent = `${priceSnapshot.data().price} руб.`;
      sizesElement.textContent = sizeValues;

      // Create color circles
      colorsValues.split(',').forEach((color) => {
        const colorCircle = document.createElement('div');
        colorCircle.className = 'colorCircle';
        colorCircle.style.backgroundColor = color.trim();
        colorsElement.appendChild(colorCircle);
      });


      
      if(userId !== 'ALL'){
        const userDoc = doc(userCollection, userId);

        // Получаем текущие данные пользователя
        getDoc(userDoc).then((userDocSnapshot) => {
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            let favouritesClothesIds = userData.idFavourites || [];

            // Преобразуем идентификатор одежды в числовой формат
            const clothIdNumber = parseInt(data.nameRef.id, 10);

            // Проверяем, содержит ли массив уже выбранный идентификатор одежды
            if (favouritesClothesIds.includes(clothIdNumber)) {
              isFavourite = true;
              const heartIcon = clothesBlock.querySelector('#heartIcon');
              heartIcon.classList.add('filled-heart');
              console.log(`${data.nameRef.id} в избранном`);
            }
          }})
      }

      const addToWardrobeButton = clothesBlock.querySelector('#addToWardrobeButton');
      addToWardrobeButton.addEventListener('click', () => {
        const clothId = data.nameRef.id; // Replace with the actual way to retrieve the clothing identifier
        addToWardrobe(clothId);
      });

      const moreButton = clothesBlock.querySelector('#moreButton');
      moreButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Stop the click event from propagating to the document
        const moreInfoContainer = document.createElement('div');
        moreInfoContainer.className = 'flex ml-50 mr-50 bg-gradient-to-r from-purple-100 to-purple-400 rounded-lg shadow dark:bg-gray-800 border-1 border-black';
        moreInfoContainer.style.position = 'absolute';
        moreInfoContainer.style.zIndex = '9999';
        moreInfoContainer.style.overflow = 'auto';
        moreInfoContainer.innerHTML = `
          <div class="relative flex-none w-20 md:w-48">
            <img alt="shopping image" class="clothImage absolute inset-0 object-cover w-full h-full rounded-lg"/>
          </div>
          <form id="clothInfoForm" class="clothInfoForm flex-auto p-6">
            <div class="flex flex-wrap">
              <h1 class="nameRef flex-auto text-xl font-semibold dark:text-gray-50">
                Classic Utility Jacket
              </h1>
              <div class="priceRef text-xl font-semibold text-red-800 dark:text-gray-300">
                $110.00
              </div>
              <div class="clothTypeRef flex-none w-full mt-2 text-sm font-medium text-gray-500 dark:text-gray-300">
              </div>
            </div>
            <div class="sizesRadioGroup flex items-baseline mt-4 mb-6 text-gray-700 dark:text-gray-300"></div>
            <div class="clothColors flex items-baseline mt-4 mb-6 text-gray-700 dark:text-gray-300"></div>
            <div class="flex mb-4 text-sm font-medium">
              <button id="addToCartButton" type="button" class="py-2 px-4  bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 focus:ring-offset-purple-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg ">
                В корзину
              </button>
            </div>
          </form>
            `;
        clothesBlock.appendChild(moreInfoContainer);

        const nameRef = moreInfoContainer.querySelector('.nameRef');
        const priceRef = moreInfoContainer.querySelector('.priceRef');
        const clothTypeRef = moreInfoContainer.querySelector('.clothTypeRef');
        const clothImage = moreInfoContainer.querySelector('.clothImage');
  
        nameRef.textContent = nameSnapshot.data().name;
        priceRef.textContent = `${priceSnapshot.data().price} руб.`;
        clothTypeRef.textContent = clothTypeValue;
        clothImage.src = imageUrl;
        const clothInfoForm = moreInfoContainer.querySelector('#clothInfoForm');
        
        const sizesValues = sizeSnapshots.map((sizeSnapshot) => sizeSnapshot.data().name);
        // Create color radio buttons
        const sizeRadioGroup = document.createElement('div');
        sizeRadioGroup.className = 'sizeRadioGroup flex space-x-2';
        sizesValues.forEach((size) => {
          const sizeRadio = document.createElement('label');
          sizeRadio.className = 'text-center';
          sizeRadio.innerHTML = `
            <input type="radio" class="flex flex-wrap items-center justify-center w-6 h-6" name="size" value="${size}">
            ${size}
          `;
          sizeRadioGroup.appendChild(sizeRadio);
        });
        clothInfoForm.appendChild(sizeRadioGroup);


        const colorsValues = colorsSnapshots.map((colorSnapshot) => colorSnapshot.data().name);
        // Create color radio buttons
        const colorRadioGroup = document.createElement('div');
        colorRadioGroup.className = 'colorRadioGroup flex space-x-2';
        colorsValues.forEach((color) => {
          const colorRadio = document.createElement('label');
          colorRadio.className = 'text-center';
          colorRadio.innerHTML = `
            <input type="radio" class="flex flex-wrap items-center justify-center w-6 h-6" name="color" value="${color}">
            ${color}
          `;
          colorRadioGroup.appendChild(colorRadio);
        });
        clothInfoForm.appendChild(colorRadioGroup);


        const darkenOverlay = document.createElement('div');
        darkenOverlay.className = 'darken-overlay';
        document.body.appendChild(darkenOverlay);
        darkenOverlay.classList.add('active');


        const addToCartButton = clothesBlock.querySelector('#addToCartButton');
        addToCartButton.addEventListener('click', () => {
          const selectedSize = document.querySelector('input[name="size"]:checked').value;
          const selectedColor = document.querySelector('input[name="color"]:checked').value;
          addToCart(data, selectedSize, selectedColor);
        });

        // Close the window when clicking outside of it
        const closeWindowHandler = (event) => {
          if (!moreInfoContainer.contains(event.target)) {
            moreInfoContainer.remove();
            darkenOverlay.classList.remove('active');
            document.removeEventListener('click', closeWindowHandler);
          }
        };
        document.addEventListener('click', closeWindowHandler);
      });

      const heartIcon = clothesBlock.querySelector('#heartIcon') 
      heartIcon.addEventListener('click', () => {
        heartIcon.classList.toggle('filled-heart');
        if(userId !== 'ALL'){
          if(!isFavourite){
            addToFavourites(data.nameRef.id);
            isFavourite = true;
          } 
          else if(isFavourite){
            removeFromFavourites(data.nameRef.id);
            isFavourite = false;
          } 
        }
      });
    }
  } catch (error) {
    console.error("Error adding clothes:", error);
  }
}

// Обработчик события для кнопки "to wardrobe"
async function addToFavourites(clothId) {
  const userCollection = collection(db, 'users');
  const userId = await getUserId();
  console.log(userId);
  if(userId === 'ALL'){
    Swal.fire({
      icon: "error",
      title: "Упс...",
      text: "Нельзя добавить одежду в избранное для незарегистрированного пользователя!",
    });
    return;
  }
  const userDoc = doc(userCollection, userId);

  // Получаем текущие данные пользователя
  getDoc(userDoc).then((userDocSnapshot) => {
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesClothesIds = userData.idFavourites || [];

      // Преобразуем идентификатор одежды в числовой формат
      const clothIdNumber = parseInt(clothId, 10);

      // Проверяем, содержит ли массив уже выбранный идентификатор одежды
      if (!favouritesClothesIds.includes(clothIdNumber)) {
        // Добавляем идентификатор одежды к массиву
        favouritesClothesIds.push(clothIdNumber);

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
    const userDoc = doc(userCollection, userId);

    // Retrieve the user document
    const userDocSnapshot = await getDoc(userDoc);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesClothesIds = userData.idFavourites || [];

      // Remove the selected cloth's ID from the wardrobeClothesIds array
      const clothIdNumber = parseInt(clothId, 10);
      console.log(clothIdNumber);
      favouritesClothesIds = favouritesClothesIds.filter((id) => id !== clothIdNumber);

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

  
  async function addToCart(data, size, color){
    const userId = await getUserId();
    console.log(userId);
    if(userId === 'ALL'){
      Swal.fire({
        icon: "error",
        title: "Упс...",
        text: "Нельзя добавить одежду в корзину для незарегистрированного пользователя",
      });
      return;
    }
    let idUser = userId;
    let idColor = color;
    let idSize = size;
    let idCloth = data.nameRef.id;
  
  
    const newShoppingCart = {
      idSize,
      idColor,
      idCloth,
      idUser,
    };
    console.log(newShoppingCart);
  
    const shoppinCartCollection = collection(db, 'shoppingCart');
    await addDoc(shoppinCartCollection, newShoppingCart);
  
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
        }).then((result) => {
          /* Read more about handling dismissals below */
          if (result.dismiss === Swal.DismissReason.timer) {
            console.log("I was closed by the timer");
          }
        }); 
  }

// Обработчик события для кнопки "to wardrobe"
async function addToWardrobe(clothId) {
  const userCollection = collection(db, 'users');
  const userId = await getUserId();
  console.log(userId);
  const userDoc = doc(userCollection, userId);

  // Получаем текущие данные пользователя
  getDoc(userDoc).then((userDocSnapshot) => {
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let wardrobeClothesIds = userData.idWardrobeClothes || [];

      // Преобразуем идентификатор одежды в числовой формат
      const clothIdNumber = parseInt(clothId, 10);

      // Проверяем, содержит ли массив уже выбранный идентификатор одежды
      if (!wardrobeClothesIds.includes(clothIdNumber)) {
        // Добавляем идентификатор одежды к массиву
        wardrobeClothesIds.push(clothIdNumber);

        // Обновляем данные пользователя в базе данных
        updateDoc(userDoc, { idWardrobeClothes: wardrobeClothesIds }).then(() => {
          Swal.fire({
            icon: "success",
            title: "Одежда добавлена в гардероб!",
            showConfirmButton: false,
            timer: 1500
          });
        }).catch((error) => {
          console.error('Error updating user data:', error);
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "Выбранная одежда уже есть в вашем гардеробе",
        });
      }
    }
  }).catch((error) => {
    console.error('Error fetching user data:', error);
  });
}


async function populateList(data, userStylesData, styleId, index) {
  let isFavourite = false;
  const stylesLists = document.getElementById('garderobStylesList');
  stylesLists.className = "p-4 -m-4 justify-center items-center";

  // Создание уникального id для блока
  const blockId = `stylesBlock${index}`;

  // Блок со стилями гардероба
  const stylesBlock = document.createElement('div');
  stylesBlock.id = blockId;
  stylesBlock.className = "-m-4 justify-center items-center";
  stylesBlock.innerHTML = `
    <div flex items-center justify-center>
    <div class="justify-center" style="display: flex; align-items: center;">
        <h1 id="txtName" class="text-4xl justify-center font-bold text-purple-800 text-center mt-10">${data.name}</h1>
        <svg class="h-8 w-8 mt-10 fill-current text-gray-500 hover:text-black ml-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path id="styleHeartIcon" d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="#4f4f4f"/>
        </svg>
    </div>
      <h1 id="txtDescription" class="text-xl justify-center font-bold text-center mt-4">${data.description}</h1>
      <div class="w-full mt-4 mb-8 justify-center">
        <div class="h-1 mx-auto gradient w-84 opacity-25 my-0 py-0 rounded-t"></div>
      </div>
    </div>
  `;

  stylesLists.appendChild(stylesBlock);

  userStylesData.forEach((data) => {
    createClothBlock(data, 'garderobStylesList');
  });




  if(userId !== 'ALL'){
    const userDoc = doc(userCollection, userId);

  // Получаем текущие данные пользователя
  getDoc(userDoc).then((userDocSnapshot) => {
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesStylesIds = userData.idFavouriteStyles || [];

      // Преобразуем идентификатор стиля в числовой формат
      console.log(styleId);

      // Проверяем, содержит ли массив уже выбранный идентификатор стиля
      if (favouritesStylesIds.includes(styleId)) {
        isFavourite = true;
        const heartIcon = stylesBlock.querySelector('#styleHeartIcon');
        heartIcon.classList.add('filled-heart');
        console.log(`${styleId} в избранном`);
      }
    }})
  }

  const styleHeartIcon = stylesBlock.querySelector('#styleHeartIcon') 
  styleHeartIcon.addEventListener('click', () => {
  styleHeartIcon.classList.toggle('filled-heart');
  if(userId !== 'ALL'){
    if(!isFavourite){
      addStyleToFavourites(styleId);
      isFavourite = true;
    } 
    else if(isFavourite){
      removeStyleFromFavourites(styleId);
      isFavourite = false;
    } 
  }
});
}

async function addStyleToFavourites(styleId){
  const userCollection = collection(db, 'users');
  const userId = await getUserId();
  console.log(userId);
  if(userId === 'ALL'){
    Swal.fire({
      icon: "error",
      title: "Упс...",
      text: "Нельзя добавить стиль в избранное для незарегистрированного пользователя",
    });
    return;
  }
  const userDoc = doc(userCollection, userId);

  // Получаем текущие данные пользователя
  getDoc(userDoc).then((userDocSnapshot) => {
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesStylеsIds = userData.idFavouriteStyles || [];


      // Проверяем, содержит ли массив уже выбранный идентификатор одежды
      if (!favouritesStylеsIds.includes(styleId)) {
        // Добавляем идентификатор одежды к массиву
        favouritesStylеsIds.push(styleId);

        // Обновляем данные пользователя в базе данных
        updateDoc(userDoc, { idFavouriteStyles: favouritesStylеsIds }).then(() => {
          Swal.fire({
            icon: "success",
            title: "Стиль добавлен в избранное!",
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
async function removeStyleFromFavourites(styleId){
  try {
    const userCollection = collection(db, 'users');
    const userDoc = doc(userCollection, userId);

    // Retrieve the user document
    const userDocSnapshot = await getDoc(userDoc);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      let favouritesStylesIds = userData.idFavouriteStyles || [];

      favouritesStylesIds = favouritesStylesIds.filter((id) => id !== styleId);

      // Update the user document with the modified wardrobeClothesIds array
      await updateDoc(userDoc, { idFavouriteStyles: favouritesStylesIds });

      // Optional: You can also update the UI to reflect the deletion
      // For example, remove the deleted cloth from the DOM

      Swal.fire({
        icon: "success",
        title: "Стиль удален из избранного!",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(function() {
      }, 2000);
    }
  } catch (error) {
    console.error('Error deleting style:', error);
  }
}

async function getStyles(){
  let i = 0;
  const stylesBody = document.getElementById('garderobStylesList');
  stylesBody.innerHTML = '';


  const userFavouriteStyles = userData.idFavouriteStyles; // Получение списка избранных стилей пользователя
  console.log(userFavouriteStyles);

  // Запрос данных из коллекции "styles" с использованием фильтра по идентификаторам избранных стилей пользователя
  const stylesRef = collection(db, 'styles');
  const stylesDocs = await Promise.all(userFavouriteStyles.map(styleId => getDoc(doc(stylesRef, styleId))));

  // Получение данных из запроса
  stylesDocs.forEach((styleDoc) => {
    i += 1;
    const data = styleDoc.data();
    if (data && data.idClothes) { // Проверка наличия свойства 'idClothes'
      const userStylesIds = data.idClothes.map(String);
      userStylesData = clothesData.filter((cloth) => userStylesIds.includes(cloth.nameRef.id));
      populateList(data, userStylesData, styleDoc.id, i);
    }
  });
}

//Рендерим все найденное
async function renderClothes(clothes) {
  const clothesList = document.getElementById('favouritesClothesList');
  clothesList.innerHTML = ''; // Очищаем лист

  clothes.forEach((data) => {
    createClothBlock(data, 'favouritesClothesList');
  });
}
//Проверяем комбобоксы и поиск
async function handleSearchAndFilter() {
  try {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedSizes = Array.from(document.querySelectorAll('#dropdownSizes input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    const selectedTypes = Array.from(document.querySelectorAll('#dropdownType input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    const selectedTypesGender = Array.from(document.querySelectorAll('#dropdownGender input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    const filteredClothesData = [];

    const promises = userClothesData.map(async (cloth) => {
      const [nameSnapshot, clothTypeSnapshot, clothTypeGenderSnapshot] = await Promise.all([
        getDoc(cloth.nameRef),
        getDoc(cloth.clothTypeRef),
        getDoc(cloth.clothTypeGenderRef)
      ]);

      const name = nameSnapshot.data().name.toLowerCase();
      const clothTypeValue = clothTypeSnapshot.data().name.toLowerCase();
      const clothTypeGenderValue = clothTypeGenderSnapshot.data().name.toLowerCase();
      const sizeIds = cloth.sizeRefs.map((sizeRef) => sizeRef.id);

      if (
        (name.includes(searchTerm) || clothTypeValue.includes(searchTerm) || clothTypeGenderValue.includes(searchTerm)) &&
        selectedSizes.some((size) => sizeIds.includes(size)) &&
        selectedTypes.includes(cloth.clothTypeRef.id) &&
        selectedTypesGender.includes(cloth.clothTypeGenderRef.id)
      ) {
        filteredClothesData.push(cloth);
      }
    });

    await Promise.all(promises);
    renderClothes(filteredClothesData);
  } catch (error) {
    console.error("Error handling search and filter:", error);
  }
}


const garderobStylesBlock = document.getElementById('favouritesStylesBlock');
const garderobClothesBlock = document.getElementById('favouritesClothesBlock');
// Функция для обработки выбора одежды
function handleClothesSelection() {

  garderobStylesBlock.hidden = true;
  garderobClothesBlock.hidden = false;
}

// Функция для обработки выбора стилей
function handleStylesSelection() {

  garderobStylesBlock.hidden = false;
  garderobClothesBlock.hidden = true;
  getStyles();
}

// Получаем ссылки на кнопки
const clothesButton = document.getElementById('clothes');
const stylesButton = document.getElementById('styles');


// Добавляем обработчики событий для кнопок
clothesButton.addEventListener('click', function() {
  // Добавляем класс активности к кнопке "Мужчина"
  clothesButton.classList.add('act');
  // Удаляем класс активности с кнопки "Женщина"
  stylesButton.classList.remove('act');
  console.log('выбрана одежда');
  handleClothesSelection();
});

stylesButton.addEventListener('click', function() {
  // Добавляем класс активности к кнопке "Женщина"
  stylesButton.classList.add('act');
  // Удаляем класс активности с кнопки "Мужчина"
  clothesButton.classList.remove('act');
  console.log('выбраны стили');
  handleStylesSelection();
});


const searchInput = document.getElementById('search');
searchInput.addEventListener('input', handleSearchAndFilter);


const sizeCheckboxes = document.querySelectorAll('#dropdownSizes input[type="checkbox"]');
sizeCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', handleSearchAndFilter);
});

const dropdownButton = document.getElementById('dropdownSizesButton');
// Обработчик события клика на кнопке
dropdownButton.addEventListener('click', function() {
  dropdownSizes.classList.toggle('hidden'); // Переключение класса для скрытия или показа выпадающего списка
});

const typeCheckboxes = document.querySelectorAll('#dropdownType input[type="checkbox"]');
typeCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', handleSearchAndFilter);
});

const typeDropdownButton = document.getElementById('dropdownTypeButton');
// Обработчик события клика на кнопке
typeDropdownButton.addEventListener('click', function() {
  dropdownType.classList.toggle('hidden'); // Переключение класса для скрытия или показа выпадающего списка
});

const genderCheckboxes = document.querySelectorAll('#dropdownGender input[type="checkbox"]');
genderCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', handleSearchAndFilter);
});

const genderDropdownButton = document.getElementById('dropdownGenderButton');
// Обработчик события клика на кнопке
genderDropdownButton.addEventListener('click', function() {
  dropdownGender.classList.toggle('hidden'); // Переключение класса для скрытия или показа выпадающего списка
});


const authButton = document.getElementById('authButton');
authButton.addEventListener('click', function() {
    window.location.href = "auth.html";
});


async function main(){
    
  if(userId !== 'ALL'){
    await renderClothes(userClothesData);
  }
}

main();


