window.onload = function () {
	Gun.init().then(() => {
		Gun.camera.position.set(0, 100, 20)
		Gun.renderer.setSize(window.innerWidth, window.innerHeight);
		Gun.renderer.setClearColor(0xcccccc)
		Gun.renderer.shadowMap.enabled = true;
		let controller = new Gun.FPC(Gun.camera)
		controller.camera.body.setFriction(0.9)
		Gun.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		Gun.userupdate = function () {

			controller.update()

			let vec = new Gun.Vec3(0, 0, 0)
			if (Gun.input.keys["ArrowDown"]) vec.z += 1
			if (Gun.input.keys["ArrowUp"]) vec.z -= 1
			if (Gun.input.keys["ArrowRight"]) vec.x += 1
			if (Gun.input.keys["ArrowLeft"]) vec.x -= 1
			ball.body.applyImpulse(vec.Ammo)
		}


		let box = new Gun.Box(new Gun.Vec3(0, 0, 0), new Gun.Quat(0, 0, 0), new Gun.Vec3(100, 1, 100))
		box.material = new THREE.MeshStandardMaterial({color: 0x00FF00})
		box.castShadow = false;
		box.receiveShadow = true;
		box.body.setRestitution(0.8)
		box.body.setFriction(0.9);
		box.body.setRollingFriction(0.9);
		box.body.tag = "ground"
		box.create()

		let ball = new Gun.Sphere(new Gun.Vec3(0, 10, 0), new Gun.Quat(0, 0, 0), 1, 1)
		ball.material = new THREE.MeshStandardMaterial({color: 0xFF0000})
		ball.castShadow = true;
		ball.receiveShadow = false;
		ball.body.setRestitution(0.8)
		ball.body.setFriction(0.9);
		ball.body.setRollingFriction(0.9);
		ball.body.setActivationState(4);	// state 4 is disable deactivation
		ball.create()



		var light = new THREE.DirectionalLight(0xFFFFFF, 1)
		light.position.set(-5, 10, 6)
		light.rotateY(10)
		light.castShadow = true
		light.shadow.mapSize.width = 1024;
		light.shadow.mapSize.height = 1024;

		light.shadow.camera.far = 13500

		Gun.scene.add(light)

		Gun.animate()
	})
}