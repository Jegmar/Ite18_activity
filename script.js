// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls: Orbit for zoom and pan
const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.1;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);  // Dim ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);  // Position light at an angle
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 10, 0);  // Positioning the point light above the sphere
scene.add(pointLight);

const hemisphereLight = new THREE.HemisphereLight(0x443333, 0x111122, 0.8);  // Sky color, ground color, intensity
scene.add(hemisphereLight);

// 3D Sphere (larger size)
const sphereGeometry = new THREE.SphereGeometry(10, 32, 32); // Increased the radius to 10
let sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700, // Default golden color
    roughness: 0.5,  // Default roughness value
    metalness: 0.5,  // Default metalness value
    envMap: null // We'll add an environment map later
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0, 0, 0); // Center the sphere in the scene
scene.add(sphere);

// Parameters object to control the sphere's material properties
const params = {
    color: "#ffd700",  // Default golden color
    roughness: 0.5,    // Default roughness
    metalness: 0.5,    // Default metalness
    numberColor: "#ffa500", // Default number color (orange)
    textColor: "#ff0000" // Default text color (red)
};

// GUI Controls for Changing Sphere Properties
const gui = new dat.GUI();

// Color control for sphere
gui.addColor(params, 'color').onChange((value) => {
    sphereMaterial.color.set(value); // Change the sphere color
});

// Roughness control for sphere
gui.add(params, 'roughness', 0, 1).onChange((value) => {
    sphereMaterial.roughness = value; // Adjust roughness of the sphere
    sphereMaterial.needsUpdate = true; // Ensure the material is updated
});

// Metalness control for sphere
gui.add(params, 'metalness', 0, 1).onChange((value) => {
    sphereMaterial.metalness = value; // Adjust metalness of the sphere
    sphereMaterial.needsUpdate = true; // Ensure the material is updated
});

// Color control for the numbers
gui.addColor(params, 'numberColor').onChange((value) => {
    numbers.forEach((number) => {
        number.material.color.set(value); // Change the color of each floating number
    });
});

// Color control for the rotating text
let textGroup; // Declare textGroup in a scope accessible to the color control

gui.addColor(params, 'textColor').onChange((value) => {
    if (textGroup) {
        textGroup.children.forEach((letterMesh) => {
            // Ensure we are working with a Mesh and it has a material
            if (letterMesh instanceof THREE.Mesh && letterMesh.material) {
                letterMesh.material.color.set(value); // Update each letter's color
                letterMesh.material.needsUpdate = true; // Ensure the material is updated
            }
        });
    }
});

// 3D Text for Floating Numbers
let numbers = [];
const fontLoader = new THREE.FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    const numberMaterial = new THREE.MeshStandardMaterial({ color: params.numberColor });

    // Specify the numbers you want (with duplications)
    const numberValues = [1.0, 1.25, 1.5, 1.75];

    // Function to check if the position is too close to the sphere
    function isPositionSafe(x, y, z) {
        const distance = Math.sqrt(x * x + y * y + z * z);
        return distance > sphere.geometry.parameters.radius + 5; // Avoid collision with a 5 unit margin
    }

    // Generate floating numbers, ensuring they don't collide with the sphere
    for (let i = 0; i < 150; i++) {
        const value = numberValues[Math.floor(Math.random() * numberValues.length)];
        const textGeometry = new THREE.TextGeometry(value.toFixed(2), {
            font: font,
            size: 1,
            height: 0.5,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelSegments: 5,
        });

        const numberMesh = new THREE.Mesh(textGeometry, numberMaterial);

        let positionSafe = false;
        let x, y, z;

        // Keep generating position until it's safe
        while (!positionSafe) {
            x = (Math.random() - 0.5) * 60;  // x position range expanded to -60 to 60
            y = (Math.random() - 0.5) * 60;  // y position range expanded to -60 to 60
            z = (Math.random() - 0.5) * 60;  // z position range expanded to -60 to 60

            // Check if the position is safe
            positionSafe = isPositionSafe(x, y, z);
        }

        // Set the safe position for the number
        numberMesh.position.set(x, y, z);

        // Assign a random slow spin speed to each number (on the Y-axis)
        numberMesh.spinSpeed = Math.random() * 0.005 + 0.001; // Slow speed between 0.001 and 0.006
        scene.add(numberMesh);
        numbers.push(numberMesh);
    }
});

// 3D Text for rotating text around the sphere (Hello text)
const textToDisplay = "   .eheh, ris ,aoma as gatahi ahomi odarg agn ina-gni atnU .semaJ ris ,iH";
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    const textMaterial = new THREE.MeshStandardMaterial({ color: params.textColor }); // Use params.textColor here
    const textGeometry = new THREE.TextGeometry(textToDisplay, {
        font: font,
        size: 1,
        height: 0.3,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 5,
    });

    textGroup = new THREE.Group(); // Create a group for the text

    // Position the text in a circular path around the sphere
    const radius = sphere.geometry.parameters.radius + 2; // Slightly larger radius to avoid collision
    textGeometry.center(); // Center the text for proper alignment

    const numLetters = textToDisplay.length;
    const angleStep = (2 * Math.PI) / numLetters;

    // Distribute each letter along the circumference
    for (let i = 0; i < numLetters; i++) {
        const letter = textToDisplay.charAt(i);
        const angle = angleStep * i;

        // Position each letter on the circle path
        const letterMesh = new THREE.Mesh(
            new THREE.TextGeometry(letter, {
                font: font,
                size: 1,
                height: 0.3,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelSegments: 5,
            }),
            textMaterial
        );

        letterMesh.position.set(
            radius * Math.cos(angle),  // x position
            0,                          // y position (flat)
            radius * Math.sin(angle)   // z position
        );

        textGroup.add(letterMesh); // Add letter mesh to the group
    }

    // Add the group to the scene
    scene.add(textGroup);

    // Animate the group of letters rotating around the sphere
    function rotateTextGroup() {
        textGroup.rotation.y -= 0.002; // Rotate the entire group around the Y-axis
        
        // Make sure each letter faces the camera
        textGroup.children.forEach((letterMesh) => {
            letterMesh.lookAt(camera.position); // Each letter faces the camera
        });
      
        requestAnimationFrame(rotateTextGroup);
    }

    rotateTextGroup();
});

// Camera Position
camera.position.set(0, 0, 30); // Adjusted to focus the camera on the center and move it back to fit the scene

// Animation
function animate() {
    requestAnimationFrame(animate);

    // Apply slow spin on the Y-axis to each number with its own speed
    numbers.forEach((number) => {
        number.rotation.y += number.spinSpeed;  // Rotate each number slowly on the Y-axis
    });

    orbitControls.update(); // Update Orbit Controls
    renderer.render(scene, camera);
}
animate();

// Responsive Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
