import * as THREE from 'three';
import Stats from 'stats.js';
import * as dat from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const init = () => {
	const sizes = {
		width: window.innerWidth / 2,
		height: window.innerHeight / 2,
	};

	const scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xffffff );
	const canvas = document.querySelector('.canvas');
	
	const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
	camera.position.set(0,62,66);
	scene.add(camera);

	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	
	// const stats = new Stats();
	// stats.showPanel(0);
	// document.body.appendChild(stats.dom);

	//const gui = new dat.GUI();

	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.physicallyCorrectLights = true;
	renderer.setPixelRatio( window.devicePixelRatio * 2);
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;
	renderer.setSize(sizes.width, sizes.height);
	renderer.render(scene, camera);

	return { sizes, scene, canvas, camera, renderer, controls };
};

export default init;