import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, addDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import './catalog.css';

// Получите идентификатор пользователя из локального хранилища
async function getUserId(){
  try{
    const userId = localStorage.getItem('userId');
    if(userId === null){
      alert('Вы не зарегестрированы, поэтому будет предоставлена вся одежда');
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




const exitButton = document.getElementById('exitButton');
exitButton.addEventListener('click', function() {
    localStorage.setItem('userId', 'ALL');
    alert('Вы успешно вышли из системы');
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
    const colorsRef = data.idColors.map((colorId) => doc(db, 'colors', colorId.toString()));
    clothesData.push({
      sizeRefs,
      nameRef,
      imageRef,
      priceRef,
      clothTypeRef,
      colorsRef
    });
  });

// Получаем данные о пользователе
const userCollection = collection(db, 'users');
const userId = await getUserId()
console.log(userId);

if(userId !== 'ALL'){
  exitButton.hidden = false;
}

const userSnapshot = await getDoc(doc(userCollection, `${userId}`)); // Замените '1' на идентификатор пользователя, для которого вы хотите отобразить одежду
const userData = userSnapshot.data();

// Преобразуем идентификаторы в строковый формат
const userFavouritesIds = userData.idFavourites.map(String);
// Фильтруем данные об одежде по идентификаторам из коллекции clothes
userClothesData = clothesData.filter((cloth) => userFavouritesIds.includes(cloth.nameRef.id));
console.log(userClothesData);

//Создаем ClothData
async function createClothBlock(data) {
  try {
    let isFavourite = false;
    let imageUrl;
    const clothesList = document.getElementById('favouritesClothesList');
    const clothesBlock = document.createElement('div');
    clothesBlock.className = "p-4 flex justify-center";
    clothesBlock.innerHTML = `
      <div class="imageContainerClothesOne720x400 bg-gray-100 p-6 rounded-lg border border-gray-950 shadow hover:shadow-lg">
        <img class="object-scale-down h-40 rounded w-40 object-center mb-6" src="" alt="content">
        <h3 class="sizesOne tracking-widest text-purple-500 text-xs font-medium title-font"></h3>
        <h1 class="clothTypeOne text-lg text-gray-900 font-medium title-font"></h4>
        <h5 class="nameOne text-lg text-gray-900 font-medium title-font"></h5>

        <div class="flex items-end mb-4">
          <h5 class="priceOne text-lg text-3xl font-bold font-medium text-purple-800 title-font"></h5>
          <svg id="heartIcon" class="h-8 w-8 fill-current text-gray-500 hover:text-black ml-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12,4.595c-1.104-1.006-2.512-1.558-3.996-1.558c-1.578,0-3.072,0.623-4.213,1.758c-2.353,2.363-2.352,6.059,0.002,8.412 l7.332,7.332c0.17,0.299,0.498,0.492,0.875,0.492c0.322,0,0.609-0.163,0.792-0.409l7.415-7.415 c2.354-2.354,2.354-6.049-0.002-8.416c-1.137-1.131-2.631-1.754-4.209-1.754C14.513,3.037,13.104,3.589,12,4.595z M18.791,6.205 c1.563,1.571,1.564,4.025,0.002,5.588L12,18.586l-6.793-6.793C3.645,10.23,3.646,7.776,5.205,6.209 c0.76-0.756,1.754-1.172,2.799-1.172s2.035,0.416,2.789,1.17l0.5,0.5c0.391,0.391,1.023,0.391,1.414,0l0.5-0.5 C14.719,4.698,17.281,4.702,18.791,6.205z" />
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
      clothTypeElement.textContent = clothTypeValue;
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
    alert('Нельзя добавить одежду в избранное для незарегистрированного пользователя.');
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
      alert('Нельзя добавить одежду в корзину для незарегистрированного пользователя. Вы можете зарегистрироваться в системе.');
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
          alert('Одежда добавлена в гардероб');
        }).catch((error) => {
          console.error('Error updating user data:', error);
        });
      } else {
        alert('Выбранная одежда уже есть в вашем гардеробе');
      }
    }
  }).catch((error) => {
    console.error('Error fetching user data:', error);
  });
}


//Рендерим все найденное
async function renderClothes(clothes) {
  const clothesList = document.getElementById('favouritesClothesList');
  clothesList.innerHTML = ''; // Очищаем лист

  clothes.forEach((data) => {
    createClothBlock(data);
  });
}
//Проверяем комбобоксы и поиск
async function handleSearchAndFilter() {
    try {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedSizes = Array.from(document.querySelectorAll('#dropdownSizes input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    const selectedTypes = Array.from(document.querySelectorAll('#dropdownType input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    const filteredClothesData = [];

    for (const cloth of userClothesData) {
      const nameSnapshot = await getDoc(cloth.nameRef);
      const name = nameSnapshot.data().name.toLowerCase();
      const clothTypeSnapshot = await getDoc(cloth.clothTypeRef);
      const clothTypeValue = clothTypeSnapshot.data().name.toLowerCase();
      const sizeIds = cloth.sizeRefs.map((sizeRef) => sizeRef.id);

      if ((name.includes(searchTerm) || (clothTypeValue.includes(searchTerm))) && selectedSizes.some((size) => sizeIds.includes(size)) && selectedTypes.includes(cloth.clothTypeRef.id)) {
        filteredClothesData.push(cloth);
      }
    }

    renderClothes(filteredClothesData);
  } catch (error) {
    console.error("Ошибка при обработке поиска и фильтрации:", error);
  }
}



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


