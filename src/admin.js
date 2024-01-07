import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import './catalog.css';

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


async function checkId(){
  const userId = await getUserId()
  if(userId !== '1'){
      window.location = 'index.html';
  }
}
checkId()


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
const clothesSnapshot = await getDocs(clothesCollection);
const clothesData = [];




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
  const modelRef = doc(clothesCollection, document.id);
  clothesData.push({
    sizeRefs,
    nameRef,
    imageRef,
    priceRef,
    clothTypeRef,
    colorsRef,
    modelRef,
    clothTypeGenderRef
  });
});

//Создаем ClothData
async function createClothBlock(data) {
  try {
    const clothesList = document.getElementById('clothesList');
    const clothesBlock = document.createElement('div');
    clothesBlock.className = "xl:w-1/4 md:w-1/2 p-4 flex justify-center";
    clothesBlock.innerHTML = `
      <div class="imageContainerClothesOne720x400 bg-gray-100 p-6 rounded-lg border border-gray-950 shadow hover:shadow-lg">
        <img class="object-scale-down h-40 rounded w-40 object-center mb-6" src="" alt="content">
        <h3 class="sizesOne tracking-widest text-purple-500 text-xs font-medium title-font"></h3>
        <h1 class="clothTypeOne text-lg text-gray-900 font-medium title-font"></h4>
        <h5 class="nameOne text-lg text-gray-900 font-medium title-font"></h5>

        <div class="flex items-end mb-4">
          <h5 class="priceOne text-lg text-3xl font-bold font-medium text-purple-800 title-font"></h5>
        </div>
        
        <div class="colorsOne flex mb-4"></div>
        <div class="flex items-stretch">
          <button id="changeClothButton" class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-l">
            Изменить
          </button>
          <button id="deleteClothButton" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-r">
            Удалить
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
        const imageUrl = await getDownloadURL(storageImageRef);
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

      const deleteClothButton = clothesBlock.querySelector('#deleteClothButton');
      deleteClothButton.addEventListener('click', () => {
        const clothId = data.nameRef.id; // Replace with the actual way to retrieve the clothing identifier
        deleteCloth(clothId);
      });
      const changeClothButton = clothesBlock.querySelector('#changeClothButton');
      changeClothButton.addEventListener('click', () => {
        const clothId = data.nameRef.id; // Replace with the actual way to retrieve the clothing identifier
        changeCloth(data);
      });
    }
  } catch (error) {
    console.error("Error adding clothes:", error);
  }
}

//Рендерим все найденное
async function renderClothes(clothes) {
  const clothesList = document.getElementById('clothesList');
  clothesList.innerHTML = ''; // Очищаем лист

  clothes.forEach((data) => {
    createClothBlock(data);
  });
}

async function handleSearchAndFilter() {
  try {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedSizes = Array.from(document.querySelectorAll('#dropdownSizes input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    const selectedTypes = Array.from(document.querySelectorAll('#dropdownType input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    const selectedTypesGender = Array.from(document.querySelectorAll('#dropdownGender input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
    const filteredClothesData = [];

    for (const cloth of clothesData) {
      const nameSnapshot = await getDoc(cloth.nameRef);
      const name = nameSnapshot.data().name.toLowerCase();
      const clothTypeSnapshot = await getDoc(cloth.clothTypeRef);
      const clothTypeValue = clothTypeSnapshot.data().name.toLowerCase();
      const clothTypeGenderSnapshot = await getDoc(cloth.clothTypeGenderRef);
      const clothTypeGenderValue = clothTypeGenderSnapshot.data().name.toLowerCase();
      const sizeIds = cloth.sizeRefs.map((sizeRef) => sizeRef.id);

      if ((name.includes(searchTerm) || (clothTypeValue.includes(searchTerm)) || (clothTypeGenderValue.includes(searchTerm))) && selectedSizes.some((size) => sizeIds.includes(size)) 
      && selectedTypes.includes(cloth.clothTypeRef.id) && selectedTypesGender.includes(cloth.clothTypeGenderRef.id)) {
        filteredClothesData.push(cloth);
      }
    }

    renderClothes(filteredClothesData);
  } catch (error) {
    console.error("Error handling search and filter:", error);
  }
}

// Обработчик события для кнопки "Удалить"
async function deleteCloth(clothId) {
    Swal.fire({
      title: "Вы уверены, что хотите удалить одежду?",
      text: "Вы больше не сможете вернуть её в каталог",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Отмена",
      confirmButtonText: "Да, удалить!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const clothCollection = collection(db, 'clothes');
          const clothDoc = doc(clothCollection, clothId);
  
          // Удаляем документ из коллекции "clothes" в Firestore
          await deleteDoc(clothDoc);
  
          // Обновляем массив idWardrobeClothes каждого пользователя
          const usersCollection = collection(db, 'users');
          const usersQuerySnapshot = await getDocs(usersCollection);
  
          usersQuerySnapshot.forEach(async (userDoc) => {
            const userData = userDoc.data();
            let wardrobeClothesIds = userData.idWardrobeClothes || [];
  
            const clothIdNumber = parseInt(clothId, 10);
            // Удаляем идентификатор удаляемой одежды из массива idWardrobeClothes
            wardrobeClothesIds = wardrobeClothesIds.filter((id) => id !== clothIdNumber);
  
            // Обновляем документ пользователя в Firestore с измененным массивом idWardrobeClothes
            await updateDoc(userDoc.ref, { idWardrobeClothes: wardrobeClothesIds });
          });
  
          Swal.fire({
            title: "Удалено!",
            text: "Одежда была удалена из каталога и из гардероба каждого пользователя.",
            icon: "success"
          });
        } catch (error) {
          console.error("Ошибка при удалении одежды:", error);
          Swal.fire({
            title: "Ошибка!",
            text: "Произошла ошибка при удалении одежды.",
            icon: "error"
          });
        }
      }
    });
}


// Обработчик события для кнопки "Изменить"
async function changeCloth(data) {

  const isImageFile = false;

  const idCloth = data.nameRef.id;
  const nameSnapshot = await getDoc(data.nameRef);
  const priceSnapshot = await getDoc(data.priceRef);
  const imagePathSnapshot = await getDoc(data.imageRef);
  const modelSnapshot = await getDoc(data.modelRef);
  const clothTypeSnapshot = await getDoc(data.clothTypeRef);
  let clothTypeValue = clothTypeSnapshot.data().name;
  const clothTypesQuery = collection(db, 'clothType');
  const clothTypesSnapshot = await getDocs(clothTypesQuery);

  const clothTypeGenderSnapshot = await getDoc(data.clothTypeGenderRef);
  let clothTypeGenderValue = clothTypeGenderSnapshot.data().name;
  const clothTypesGenderQuery = collection(db, 'clothTypeGender');
  const clothTypesGenderSnapshot = await getDocs(clothTypesGenderQuery);
  const sizesSnapshot = await getDocs(collection(db, 'sizes'));
  const colorsSnapshot = await getDocs(collection(db, 'colors'));


  let sizesHtml = '';
  sizesSnapshot.forEach((sizeDoc) => {
    const sizeData = sizeDoc.data();
    const isChecked = data.sizeRefs.some((sizeRef) => sizeRef.id === sizeDoc.id);
    sizesHtml += `
      <li style="display: flex; align-items: center;">
        <div>
          <input ${isChecked ? 'checked' : ''} id="checkbox-item-${sizeDoc.id}" type="checkbox" value="${sizeDoc.id}" >
          <label for="checkbox-item-${sizeDoc.id}" > ${sizeData.name}</label>
        </div>
      </li>`;
  });

  let colorsHtml = '';
  colorsSnapshot.forEach((colorDoc) => {
    const colorData = colorDoc.data();
    const isChecked = data.colorsRef.some((colorRef) => colorRef.id === colorDoc.id);
    colorsHtml += `
      <li style="display: flex; align-items: center;">
        <div>
          <input ${isChecked ? 'checked' : ''} id="checkbox-item-${colorDoc.id}" type="checkbox" value="${colorDoc.id}" >
          <label for="checkbox-item-${colorDoc.id}" > ${colorData.name}</label>
        </div>
      </li>`;
  });

  let clothesHtml = `
    <div>Наименование</div>
    <input type="text" id="Name" class="swal2-input" placeholder="Наименование" value="${nameSnapshot.data().name}" required>
    <div>Тип одежды</div>
    <select name="clothType" class="swal2-input" id="clothType-select">
    </select>
    <select name="clothTypeGender" class="swal2-input" id="clothTypeGender-select">
    </select>
    <div>Цена</div>
    <form oninput="result.value = slider.value">
      <input type="range" id="slider" class="swal2-input" min="100" max="100000" step="10" value="${priceSnapshot.data().price}"> <br />
      Цена товара <output name="result" for="slider">${priceSnapshot.data().price}</output> руб.
    </form>
    <div>Размеры</div>
    <ul id="sizes" class="border-2 border-black overflow-y-auto text-sm text-gray-700 dark:text-gray-200" style="list-style: none; padding: 0;">
      ${sizesHtml}
    </ul>
    <div>Цвета</div>
    <ul id="colors" class="border-2 border-black overflow-y-auto text-sm text-gray-700 dark:text-gray-200" style="list-style: none; padding: 0;">
      ${colorsHtml}
    </ul>
    <div>Фото</div>
    <input type="text" id="Image" class="swal2-input" placeholder="Фото" value="${imagePathSnapshot.data().image}" required readonly>
    <input type="file" id="image" class="swal2-input" name="image" placeholder="Фото" accept="image/jpeg" value=""/>
    <div>3Д модель</div>
    <input type="text" id="Model" class="swal2-input" placeholder="Модель" value="${modelSnapshot.data().model}" required readonly>
    <input type="file" id="model" class="swal2-input" name="model" placeholder="Модель" accept=".glb,.gltf" value=""/>
  `;

  // ... (существующий код)

  // Отображение модального окна с формой для ввода данных и предварительно заполненными значениями
  Swal.fire({
    title: 'Изменение данных',
    html: clothesHtml,
    showCancelButton: true,
    confirmButtonText: 'Сохранить',
    cancelButtonText: 'Отмена',
    focusConfirm: false,
    willOpen: () => {
      const clothTypeSelect = document.getElementById('clothType-select');
      clothTypesSnapshot.forEach((clothTypeDoc) => {
        const option = document.createElement('option');
        option.value = clothTypeDoc.id;
        option.textContent = clothTypeDoc.data().name;
        if (clothTypeDoc.data().name === clothTypeValue) {
          option.selected = true; // Устанавливаем выбранный по умолчанию
        }
        clothTypeSelect.appendChild(option);
      });

      const clothTypeGenderSelect = document.getElementById('clothTypeGender-select');
      clothTypesGenderSnapshot.forEach((clothTypeDoc) => {
        const option = document.createElement('option');
        option.value = clothTypeDoc.id;
        option.textContent = clothTypeDoc.data().name;
        if (clothTypeDoc.data().name === clothTypeGenderValue) {
          option.selected = true; // Устанавливаем выбранный по умолчанию
        }
        clothTypeGenderSelect.appendChild(option);
      });


      const imageInput = document.getElementById('image');
      const imageOutput = document.getElementById('Image');
      imageInput.addEventListener('change', () => {
        // Получите выбранный файл
        const selectedFile = imageInput.files[0];
        // Получите название файла
        const fullFileName = selectedFile.name;
        const fileName = fullFileName.substring(0, fullFileName.lastIndexOf('.'));
        // Запишите название файла в элемент с id="Image"
        imageOutput.value = fileName;
      });

      const modelInput = document.getElementById('model');
      const modelOutput = document.getElementById('Model');
      modelInput.addEventListener('change', () => {
        // Получите выбранный файл
        const selectedFile = modelInput.files[0];
        // Получите название файла
        const fullFileName = selectedFile.name;
        const fileName = fullFileName.substring(0, fullFileName.lastIndexOf('.'));
        // Запишите название файла в элемент с id="Image"
        modelOutput.value = fileName;
      });
    },
    preConfirm: async () => {
      const selectedSizes = Array.from(document.querySelectorAll('#sizes input[type="checkbox"]:checked')).map((checkbox) => parseInt(checkbox.value.replace(/\/sizes\//, '')));
      const selectedColors = Array.from(document.querySelectorAll('#colors input[type="checkbox"]:checked')).map((checkbox) => parseInt(checkbox.value.replace(/\/colors\//, '')));

      
      const imageInput = document.getElementById('image');
      const selectedFile = imageInput.files[0];
      if(selectedFile){
        const fullFileName = selectedFile.name;
        const imageFileName = fullFileName.substring(0, fullFileName.lastIndexOf('.'));
        const storageRef = ref(storage, `images/${imageFileName}.jpg`);
        await uploadBytes(storageRef, selectedFile);
      }
      
      const modelInput = document.getElementById('model');
      const selectedModel = modelInput.files[0];
      if (selectedModel) {
        const formData = new FormData();
        formData.append('file', selectedModel);

        fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData,
        })
          .then(response => response.text())
          .then(data => {
            console.log(data); // Выводим ответ сервера в консоль
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }


      return { selectedSizes, selectedColors };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const selectedSizeIds = result.value.selectedSizes;
      const selectedColorIds = result.value.selectedColors;



      const nameRef = doc(db, 'clothes', data.nameRef.id);
      const priceRef = doc(db, 'clothes', data.priceRef.id);
      const imageRef = doc(db, 'clothes', data.imageRef.id);
      const modelRef = doc(db, 'clothes', data.modelRef.id);
      const clothTypeRef = doc(db, 'clothes', data.clothTypeRef.id);

      // Обновление данных в Firestore
      updateDoc(nameRef, { name: document.getElementById('Name').value });
      updateDoc(priceRef, { price: parseInt(document.getElementById('slider').value) });
      updateDoc(imageRef, { image: document.getElementById('Image').value });
      updateDoc(modelRef, { model: document.getElementById('Model').value });

      // Get the selected cloth type ID from the <select> element
      const selectedClothType = document.getElementById('clothType-select').value;
      // Get the selected cloth type ID from the <select> element
      const selectedClothTypeGender = document.getElementById('clothTypeGender-select').value;


      // Update the document in the "clothes" collection with the selected color and size IDs
      const docRef = doc(db, 'clothes', idCloth);
      updateDoc(docRef, { idColors: selectedColorIds, idSizes: selectedSizeIds, idClothType: selectedClothType, idClothTypeGender: selectedClothTypeGender });

      Swal.fire({
        icon: "success",
        title: "Информация сохранена!",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(function() {
      }, 2000);
    }
  });
}

async function addCloth() {

  const clothTypesQuery = collection(db, 'clothType');
  const clothTypesSnapshot = await getDocs(clothTypesQuery);
  const clothTypesGenderQuery = collection(db, 'clothTypeGender');
  const clothTypesGenderSnapshot = await getDocs(clothTypesGenderQuery);
  const sizesSnapshot = await getDocs(collection(db, 'sizes'));
  const colorsSnapshot = await getDocs(collection(db, 'colors'));


  let sizesHtml = '';
  sizesSnapshot.forEach((sizeDoc) => {
    const sizeData = sizeDoc.data();
    sizesHtml += `
      <li style="display: flex; align-items: center;">
        <div>
          <input id="checkbox-item-${sizeDoc.id}" type="checkbox" value="${sizeDoc.id}" >
          <label for="checkbox-item-${sizeDoc.id}" > ${sizeData.name}</label>
        </div>
      </li>`;
  });

  let colorsHtml = '';
  colorsSnapshot.forEach((colorDoc) => {
    const colorData = colorDoc.data();
    colorsHtml += `
      <li style="display: flex; align-items: center;">
        <div>
          <input id="checkbox-item-${colorDoc.id}" type="checkbox" value="${colorDoc.id}" >
          <label for="checkbox-item-${colorDoc.id}" > ${colorData.name}</label>
        </div>
      </li>`;
  });

  let clothesHtml = `
    <div>Наименование</div>
    <input type="text" id="Name" class="swal2-input" placeholder="Наименование" value="" required>
    <div>Тип одежды</div>
    <select name="clothType" class="swal2-input" id="clothType-select">
    </select>
    <select name="clothTypeGender" class="swal2-input" id="clothTypeGender-select">
    </select>
    <div>Цена</div>
    <form oninput="result.value = slider.value">
      <input type="range" id="slider" class="swal2-input" min="100" max="100000" step="10" value=""> <br />
      Цена товара <output name="result" for="slider">0</output> руб.
    </form>
    <div>Размеры</div>
    <ul id="sizes" class="border-2 border-black overflow-y-auto text-sm text-gray-700 dark:text-gray-200" style="list-style: none; padding: 0;">
      ${sizesHtml}
    </ul>
    <div>Цвета</div>
    <ul id="colors" class="border-2 border-black overflow-y-auto text-sm text-gray-700 dark:text-gray-200" style="list-style: none; padding: 0;">
      ${colorsHtml}
    </ul>
    <div>Фото</div>
    <input type="text" id="Image" class="swal2-input" placeholder="Фото" value="" required readonly>
    <input type="file" id="image" class="swal2-input" name="image" placeholder="Фото" accept="image/jpeg" value=""/>
    <div>3Д модель</div>
    <input type="text" id="Model" class="swal2-input" placeholder="Модель" value="" required readonly>
    <input type="file" id="model" class="swal2-input" name="model" placeholder="Модель" accept=".glb,.gltf" value=""/>
  `;

  // Отображение модального окна с формой для ввода данных и предварительно заполненными значениями
  Swal.fire({
    title: 'Добавление одежды',
    html: clothesHtml,
    showCancelButton: true,
    confirmButtonText: 'Сохранить',
    cancelButtonText: 'Отмена',
    focusConfirm: false,
    willOpen: () => {
      const clothTypeSelect = document.getElementById('clothType-select');
      clothTypesSnapshot.forEach((clothTypeDoc) => {
      const option = document.createElement('option');
      option.value = clothTypeDoc.id; // Set the value to the document ID
      option.textContent = clothTypeDoc.data().name;
      // if (clothTypeDoc.data().name === clothTypeValue) {
      //   option.value = clothTypeDoc.data().name; // Устанавливаем выбранный по умолчанию
      // }
      clothTypeSelect.appendChild(option);
      });

      const clothTypeGenderSelect = document.getElementById('clothTypeGender-select');
      clothTypesGenderSnapshot.forEach((clothTypeDoc) => {
      const option = document.createElement('option');
      option.value = clothTypeDoc.id; // Set the value to the document ID
      option.textContent = clothTypeDoc.data().name;
      // if (clothTypeDoc.data().name === clothTypeValue) {
      //   option.value = clothTypeDoc.data().name; // Устанавливаем выбранный по умолчанию
      // }
      clothTypeGenderSelect.appendChild(option);
      });

      const imageInput = document.getElementById('image');
      const imageOutput = document.getElementById('Image');
      imageInput.addEventListener('change', () => {
        // Получите выбранный файл
        const selectedFile = imageInput.files[0];
        // Получите название файла
        const fullFileName = selectedFile.name;
        const fileName = fullFileName.substring(0, fullFileName.lastIndexOf('.'));
        // Запишите название файла в элемент с id="Image"
        imageOutput.value = fileName;
      });

      const modelInput = document.getElementById('model');
      const modelOutput = document.getElementById('Model');
      modelInput.addEventListener('change', () => {
        // Получите выбранный файл
        const selectedFile = modelInput.files[0];
        // Получите название файла
        const fullFileName = selectedFile.name;
        const fileName = fullFileName.substring(0, fullFileName.lastIndexOf('.'));
        // Запишите название файла в элемент с id="Image"
        modelOutput.value = fileName;
      });
    },
    preConfirm: async () => {
      const clothTypeSelectElement = document.getElementById('clothType-select');
      const idClothType = clothTypeSelectElement.value;
      const clothTypeGenderSelectElement = document.getElementById('clothTypeGender-select');
      const idClothTypeGender = clothTypeGenderSelectElement.value;
      const selectedSizes = Array.from(document.querySelectorAll('#sizes input[type="checkbox"]:checked')).map((checkbox) => parseInt(checkbox.value.replace(/\/sizes\//, '')));
      const selectedColors = Array.from(document.querySelectorAll('#colors input[type="checkbox"]:checked')).map((checkbox) => parseInt(checkbox.value.replace(/\/colors\//, '')));


      const imageInput = document.getElementById('image');
      const selectedFile = imageInput.files[0];
      if(selectedFile){
        const fullFileName = selectedFile.name;
        const imageFileName = fullFileName.substring(0, fullFileName.lastIndexOf('.'));
        const storageRef = ref(storage, `images/${imageFileName}.jpg`);
        await uploadBytes(storageRef, selectedFile);
      }
      
      const modelInput = document.getElementById('model');
      const selectedModel = modelInput.files[0];
      if (selectedModel) {
        const formData = new FormData();
        formData.append('file', selectedModel);

        fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData,
        })
          .then(response => response.text())
          .then(data => {
            console.log(data); // Выводим ответ сервера в консоль
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }

      const selectedImage = document.getElementById('Image').value;
      const selectedModelname = document.getElementById('Model').value;
      const selectedName = document.getElementById('Name').value;
      const selectedPrice = parseInt(document.getElementById('slider').value);

      return { selectedSizes, selectedColors, idClothType, idClothTypeGender, selectedImage, selectedModelname, selectedName, selectedPrice};
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      // Получите последний документ в коллекции "clothes"
      const lastClothQuery = query(collection(db, 'clothes'), orderBy('__name__', 'desc'), limit(1));
      const lastClothSnapshot = await getDocs(lastClothQuery);
      const lastClothId = lastClothSnapshot.docs[0].id;

      // Преобразуйте идентификатор в целое число
      const lastClothIdNumber = parseInt(lastClothId);

      // Вычислите новый идентификатор
      const newClothIdNumber = lastClothIdNumber + 1;

      // Присвойте новый идентификатор новому документу
      const newClothId = newClothIdNumber.toString();

      const selectedType = result.value.idClothType;
      const selectedTypeGender = result.value.idClothTypeGender;
      const selectedSizeIds = result.value.selectedSizes;
      const selectedColorIds = result.value.selectedColors;
      const selectedImage = result.value.selectedImage;
      const selectedModel = result.value.selectedModelname;
      const selectedName = result.value.selectedName;
      const selectedPrice = result.value.selectedPrice;


      
      console.log('New Cloth ID:', newClothId);

      const newClothData = {
        idClothType: selectedType,
        idClothTypeGender: selectedTypeGender,
        idColors: selectedColorIds,
        idSizes: selectedSizeIds,
        image: selectedImage,
        model: selectedModel,
        name: selectedName,
        price: selectedPrice
      };

      // Добавьте новый документ в коллекцию "clothes" с новым идентификатором
      const newClothDocRef = await setDoc(doc(db, 'clothes', newClothId), newClothData);


      Swal.fire({
        icon: "success",
        title: "Информация сохранена!",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(function() {
      }, 2000);
    }
  });
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

const genderCheckboxes = document.querySelectorAll('#dropdownGender input[type="checkbox"]');
genderCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', handleSearchAndFilter);
});

const genderDropdownButton = document.getElementById('dropdownGenderButton');
// Обработчик события клика на кнопке
genderDropdownButton.addEventListener('click', function() {
  dropdownGender.classList.toggle('hidden'); // Переключение класса для скрытия или показа выпадающего списка
});

const addNewButton = document.getElementById('addNewButton');
addNewButton.addEventListener('click', addCloth);

const authButton = document.getElementById('authButton');
authButton.addEventListener('click', function() {
    window.location.href = "auth.html";
});

const exitButton = document.getElementById('exitButton');
exitButton.addEventListener('click', function() {
    localStorage.setItem('userId', 'ALL');
    alert('Вы успешно вышли из системы');
    exitButton.hidden = true;
    location.reload();
});


async function main(){
  await renderClothes(clothesData);
}

main()