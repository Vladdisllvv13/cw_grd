// import * as THREE from 'three';
// import TWEEN from 'three/examples/jsm/libs/tween.module';
// import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
// import init from './init';
// import './init.css';

// // Получите идентификатор пользователя из локального хранилища
// async function getUserId(){
//     try{
//       const userId = localStorage.getItem('userId');
//       if(userId === null){
//         return 'ALL'
//       }else return userId;
//     }
//     catch(error){
//       return "ALL"
//     }
//   }

// const firebaseConfig = {
//     apiKey: "AIzaSyAgfHpqhm8BYiQTE30cusEJMC4uK8lTPis",
//     authDomain: "virt-shop.firebaseapp.com",
//     projectId: "virt-shop",
//     storageBucket: "virt-shop.appspot.com",
//     messagingSenderId: "72126462317",
//     appId: "1:72126462317:web:1eb5af9da767369cf84264",
//     measurementId: "G-ZS4NNVK5K5"
//   };


// const { sizes, camera, scene, canvas, controls, renderer, stats, gui } = init();

// const colorParams = {
//     color: '#444444'
// };

// camera.position.y = 6;
// camera.position.z = 8;

// let currentMaterial = null;



// //Пол
// function addFloor(){
//     const floor = new THREE.Mesh(
//         new THREE.BoxGeometry(30,30,2),
//         new THREE.MeshStandardMaterial({
//             color: '#444444',
//             metalness: 0,
//             //roughness: 0.5,
//         }),
//     );
//     floor.position.set(0, -0.9, 0);
//     floor.receiveShadow = true;
//     floor.rotation.x = -Math.PI * 0.5;
//     scene.add(floor);
// }

// //Текстуры
//     const textureLoader = new THREE.TextureLoader();
//     const texture = textureLoader.load('/textures/fabric2/fabric_130_roughness-1K.png');
//     const texture1 = textureLoader.load('/textures/tkan2/fabric_138_basecolor-1K.png');
//     const texture2 = textureLoader.load('/textures/tkan2/fabric_138_roughness-1K.png');
//     const texture3 = textureLoader.load('/textures/fabric2/fabric_130_albedo-1K.png');
//     const texture4 = textureLoader.load('/textures/fabric1/Fabric_037_basecolor.jpg');

// //Материал
// function setMaterial(currentColor, currentMetalness, currentRoughness, currentMap){
//     currentMaterial = new THREE.MeshStandardMaterial({
//         color: currentColor,
//         metalness: currentMetalness,
//         roughness: currentRoughness,
//         //map: currentMap,
//     });
// }

// //Свет
// function addLights(){
//     const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
//     hemiLight.position.set(0, 50, 0);
//     scene.add(hemiLight);

//     const dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
//     dirLight.position.set(100, 100, 100);
//     dirLight.target.position.set(75, 20, 0);
//     dirLight.castShadow = true;
//     dirLight.shadow.bias = -0.01;
//     dirLight.shadow.mapSize = new THREE.Vector2(2048, 2048);
//     scene.add(dirLight);
// }

// //Загрузка модели
// function loadModel(){
//     const loader = new GLTFLoader();
//     loader.load(
//         './3DModels/male/MALE_mannequin1.glb',
//         (gltf) => {
//             console.log('success');
//             console.log(gltf);

//             //gltf.scene.position.set(5, 0, 0);
//             //gltf.scene.scale.set(11, 11, 11);

//             const tshirt = gltf.scene.children[0];
//             tshirt.material = currentMaterial;
//             const classicPants = gltf.scene.children[1];
//             //const tshirtWithPockets = gltf.scene.children[2];
//             //const model4 = gltf.scene.children[3];
//             //const jacket = gltf.scene.children[4];
//             const mannequin = gltf.scene.children[5];


//             scene.add(tshirt);
//             scene.add(classicPants);
//             //scene.add(tshirtWithPockets);
//             //scene.add(model4);
//             //scene.add(jacket);
//             scene.add(mannequin);
            
//             //scene.remove(trousers);
            
//             // let mannequin_coordinates = mannequin.position;
//             camera.lookAt(tshirt.position);
//             gui.addColor(colorParams, 'color').onChange(() => currentMaterial.color.set(colorParams.color));
//             //tick(gltf);
//         },
//         (progress) => {
//             console.log('progess');
//             console.log(progress);
//         },
//         (error) => {
//             console.log('error');
//             console.log(error);
//         },
//     );
// }


// function main(){
//     addFloor();
//     setMaterial("#dda15e", 0, 0.4, texture2);
//     addLights();
//     loadModel();

// }

// main();


// //Анимация
// const clock = new THREE.Clock();
// const tick = () => {
//     //stats.begin();
//     controls.update();
//     const delta = clock.getDelta();

//     //gltf.rotation.y += elapsedTime;
//     // if (activeIndex !== -1){
//     //     group.children[activeIndex].rotation.y += delta / 2;
//     // }

//     if (camera.position.y < 2) {
//         camera.position.y = 2;
//     }

//     TWEEN.update();
//     renderer.render(scene, camera);
//     //stats.end();
//     window.requestAnimationFrame(tick);
// };
// tick();

// //Изменение размеров окна
// window.addEventListener('resize', () => {
//     sizes.width = window.innerWidth / 2;
//     sizes.height = window.innerHeight / 2;

//     camera.aspect = sizes.width / sizes.height;
//     camera.updateProjectionMatrix();

//     renderer.setSize(sizes.width, sizes.height);
//     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
//     renderer.render(scene, camera);
// })



// // //Во весь экран
// // window.addEventListener('dblclick', () => {
// //     if (document.fullscreenElement){
// //         document.exitFullscreen();
// //     } else {
// //         canvas.requestFullscreen();
// //     }
// // })



// // //Координатные оси
// // const axesHelper = new THREE.AxesHelper(3);
// // scene.add(axesHelper);

// // //Объекты
// // const group = new THREE.Group();
// // group.rotation.x = Math.PI * 0.1;

// // const geometries = [
// //     new THREE.BoxGeometry(2, 6, 2),
// //     new THREE.BoxGeometry(1, 2, 8),
// //     new THREE.BoxGeometry(6, 1, 3),
// // ];

// // const parametres = {
// //     color: 0xff0000,
// // }

// // let index = 0;
// // let activeIndex = -1;
// // for (let i = -8; i <=8; i += 8){
// //     const material = new THREE.MeshBasicMaterial({
// //         color: parametres.color,
// //         wireframe: true,
// //     })
// //     const mesh = new THREE.Mesh(geometries[index], material);
// //     mesh.position.set(i, 0, 0);
// //     mesh.index = index;
// //     mesh.basePosition = new THREE.Vector3(i, 0, 0);
// //     group.add(mesh);
// //     index += 1;

// //     gui.addColor(parametres, 'color').onChange(() => material.color.set(parametres.color));
// // }

// //scene.add(group);

// //Обработка клика на объект
// // const resetActive = () => {
// //     group.children[activeIndex].material.color.set('gray');
// //     new TWEEN.Tween(group.children[activeIndex].position).to(
// //         {
// //             x: group.children[activeIndex].basePosition.x,
// //             y: group.children[activeIndex].basePosition.y,
// //             z: group.children[activeIndex].basePosition.z,
// //         }, Math.random() * 1000 + 1000,)
// //     .easing(TWEEN.Easing.Exponential.InOut)
// //     .start();
// //     activeIndex = -1;
// // };

// // const raycaster = new THREE.Raycaster();
// // const handleClick = (event) => {
// //     const pointer = new THREE.Vector2();
// //     pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
// //     pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

// //     raycaster.setFromCamera(pointer, camera);
// //     const intersections = raycaster.intersectObjects(group.children);

// //     if (activeIndex !== -1){
// //         resetActive();
// //     }

// //     for (let i = 0; i < intersections.length; i += 1){
// //         intersections[i].object.material.color.set('purple');
// //         activeIndex = intersections[i].object.index;

// //         new TWEEN.Tween(intersections[i].object.position).to(
// //             {
// //                 x: 0,
// //                 y: 0,
// //                 z: 4,
// //             }, Math.random() * 1000 + 1000,)
// //         .easing(TWEEN.Easing.Exponential.InOut)
// //         .start();
// //     }
// // };
// // window.addEventListener('click', handleClick);

// const authButton = document.getElementById('authButton');
// authButton.addEventListener('click', function() {
//     window.location.href = "auth.html";
// });

// const exitButton = document.getElementById('exitButton');
// exitButton.addEventListener('click', function() {
//     localStorage.setItem('userId', 'ALL');
//     alert('Вы успешно вышли из системы');
//     exitButton.hidden = true;
//     location.reload();
// });

// const userId = await getUserId();
// console.log(userId);
// if(userId !== 'ALL'){
//   exitButton.hidden = false;
// }
