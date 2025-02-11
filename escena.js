import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.173.0/+esm";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three/examples/jsm/loaders/GLTFLoader.js/+esm";
import gsap from "https://cdn.skypack.dev/gsap";


// Variables globales
let scene, camera, renderer;
const textureLoader = new THREE.TextureLoader();
let particleData;
let currentCameraIndex = 0;
let autoLoopTimeout;

// Puntos clave para la cámara
const cameraPositions = [
    { position: new THREE.Vector3(34,5, 5.5, 18), lookAt: new THREE.Vector3(-0.23, 1.97, 0.54) },
    { position: new THREE.Vector3(1.4, 3.61, 2.87), lookAt: new THREE.Vector3(-0.23, 1.97, 0.54) },
    { position: new THREE.Vector3(-1.96, 2, 1.55), lookAt: new THREE.Vector3(-0.23, 1.97, 0.54) },
    { position: new THREE.Vector3(0.14, 8.56, 0.46), lookAt: new THREE.Vector3(-0.23, 1.97, 0.54) },
    { position: new THREE.Vector3(-26.60, 1.82, 0.77), lookAt: new THREE.Vector3(-0.23, 1.97, 0.54) },
    { position: new THREE.Vector3(0.34, 2.75, -0.79), lookAt: new THREE.Vector3(-0.23, 1.97, 0.54) }
];

// Inicialización
init();
animate();

function init() {
    const container = document.createElement("div");
    document.body.appendChild(container);

    scene = new THREE.Scene();
    const backgroundTexture = textureLoader.load("https://raw.githubusercontent.com/Master-Chief131/ComputacionGrafica/refs/heads/luis2/public/textures/bgpch.png");
    scene.background = backgroundTexture;
    
    camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(33, 27, 17);
    camera.lookAt(1, 26, -1);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    initLights();
    initSkybox();
    initModel();
    particleData = initParticles();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);

    // Iniciar la animación de la cámara en bucle
    startCameraLoop();
}

function initLights() {
  // const light = new THREE.AmbientLight( 0xffffff, 2, 50 );
  const light = new THREE.PointLight(0xffffff, 100, 50);
  // light.position.set(-20, 20, 20);
  light.position.set(-3, 8, 10);
  scene.add(light);
}

function initSkybox() {
    const skyTexture = textureLoader.load("https://raw.githubusercontent.com/Master-Chief131/ComputacionGrafica/refs/heads/luis2/public/textures/fondo_space.jpg");
    const skyBoxGeometry = new THREE.SphereGeometry(50, 50, 50);
    const skyBoxMaterial = new THREE.MeshBasicMaterial({
        map: skyTexture,
        opacity: 0.2,
        side: THREE.BackSide,
        transparent: true,
    });
    const skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    scene.add(skyBox);
}

function initModel() {
    const loader = new GLTFLoader();
    loader.load("https://raw.githubusercontent.com/Master-Chief131/ComputacionGrafica/refs/heads/luis2/public/models/escena_completa.glb", function (gltf) {
        scene.add(gltf.scene);
        render();
    });
}

function initParticles() {
    const particleCount = 500;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        let x = (Math.random() - 0.5) * 50;
        let y = (Math.random() - 0.5) * 50;
        let z = (Math.random() - 0.5) * 50;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        velocities[i * 3] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

        sizes[i] = Math.random() * 2 + 1;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleTexture = textureLoader.load("https://raw.githubusercontent.com/Master-Chief131/ComputacionGrafica/refs/heads/luis2/public/textures/luzdeprueba1.png");
    const material = new THREE.PointsMaterial({
        map: particleTexture,
        size: 1.5,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, material);
    scene.add(particleSystem);

    return { particles, velocities, particleSystem };
}

// Función para cambiar la cámara con zoom in y out
function changeCamera(index) {
    const nextPosition = cameraPositions[index];

    gsap.to(camera.position, {
        x: nextPosition.position.x,
        y: nextPosition.position.y,
        z: nextPosition.position.z,
        duration: 3,
        ease: "power2.inOut",
        onStart: () => {
            gsap.to(camera, { fov: 15, duration: 1.5, ease: "power2.out" }); // Zoom in
        },
        onComplete: () => {
            gsap.to(camera, { fov: 25, duration: 1.5, ease: "power2.in" }); // Zoom out
        }
    });

    gsap.to(camera.rotation, {
        duration: 3,
        onUpdate: () => {
            camera.lookAt(nextPosition.lookAt);
        }
    });

    camera.updateProjectionMatrix();
}

// Bucle automático de la cámara
function startCameraLoop() {
    function loop() {
        currentCameraIndex = (currentCameraIndex + 1) % cameraPositions.length;
        changeCamera(currentCameraIndex);

        autoLoopTimeout = setTimeout(loop, 5000);
    }

    loop();
}

// Función para cambiar de cámara manualmente con teclas 1,2,3,4
function onKeyDown(event) {
    if (event.key >= '1' && event.key <= '4') {
        let selectedIndex = parseInt(event.key) - 1;

        // Detener el bucle automático
        clearTimeout(autoLoopTimeout);

        // Cambiar a la cámara seleccionada por el usuario
        changeCamera(selectedIndex);
        currentCameraIndex = selectedIndex;

        // Reiniciar el bucle automático después de 10 segundos
        setTimeout(startCameraLoop, 10000);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function animate() {
    requestAnimationFrame(animate);

    const positions = particleData.particles.attributes.position.array;
    const velocities = particleData.velocities;

    for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        if (positions[i] > 25 || positions[i] < -25) velocities[i] *= -1;
        if (positions[i + 1] > 25 || positions[i + 1] < -25) velocities[i + 1] *= -1;
        if (positions[i + 2] > 25 || positions[i + 2] < -25) velocities[i + 2] *= -1;
    }

    particleData.particles.attributes.position.needsUpdate = true;

    render();
}

function render() {
    renderer.render(scene, camera);
}

// musica
var controlAudio = document.getElementById('Toque');
var audio = document.getElementById('mySong');
var audioPlaying = false;
var firstPlay = true;
var currentTime = 0;

document.body.addEventListener('click', function() {
   if (!audioPlaying) {
      if (firstPlay) {
         // audio.currentTime = currentTime;
         firstPlay = false;
      }
      audio.play().then(function() {
         // Reproducción exitosa
         console.log('Audio reproduciéndose');
         audioPlaying = true;
         controlAudio.textContent = '';
      }).catch(function(error) {
         // Manejar errores de reproducción
         console.error('Error al reproducir audio:', error);
      });
   } else {
      audio.pause();
      audioPlaying = false;
      controlAudio.textContent = '';
   }
});
