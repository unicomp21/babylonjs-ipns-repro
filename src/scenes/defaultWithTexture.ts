import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateSceneClass } from "../createScene";

// If you don't need the standard material you will still need to import it since the scene requires it.
// import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import grassTextureUrl from "../../assets/grass.jpg";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import {connect, StringCodec} from "nats.ws";

// write some code that runs
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import * as IPFS from 'ipfs-core';
import {delay} from "@esfx/";

export class DefaultSceneWithTexture implements CreateSceneClass {
    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

        void Promise.all([
            import("@babylonjs/core/Debug/debugLayer"),
            import("@babylonjs/inspector"),
        ]).then((_values) => {
            console.log(_values);
            scene.debugLayer.show({
                handleResize: true,
                overlay: true,
                globalRoot: document.getElementById("#root") || undefined,
            });
        });

        // This creates and positions a free camera (non-mesh)
        const camera = new ArcRotateCamera(
            "my first camera",
            0,
            Math.PI / 3,
            10,
            new Vector3(0, 0, 0),
            scene
        );

        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        // const light = new HemisphericLight(
        //     "light",
        //     new Vector3(0, 1, 0),
        //     scene
        // );

        // // Default intensity is 1. Let's dim the light a small amount
        // light.intensity = 0.7;

        // Our built-in 'sphere' shape.
        const sphere = CreateSphere(
            "sphere",
            { diameter: 2, segments: 32 },
            scene
        );

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape.
        const ground = CreateGround(
            "ground",
            { width: 6, height: 6 },
            scene
        );

        // Load a texture to be used as the ground material
        const groundMaterial = new StandardMaterial("ground material", scene);
        groundMaterial.diffuseTexture = new Texture(grassTextureUrl, scene);

        ground.material = groundMaterial;
        ground.receiveShadows = true;

        const light = new DirectionalLight(
            "light",
            new Vector3(0, -1, 1),
            scene
        );
        light.intensity = 0.5;
        light.position.y = 10;

        const shadowGenerator = new ShadowGenerator(512, light)
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurScale = 2;
        shadowGenerator.setDarkness(0.2);

        shadowGenerator.getShadowMap()!.renderList!.push(sphere);

        this.spawnIpnsTest().then(() => {
           console.log("returned from spawnIpnsTest");
        });
        this.spawnWebsocketTest().then(() => {
            console.log("returned from spawnWebsocketTest");
        });
        
        return scene;
    };
    private async spawnIpnsTest() {
        // The IPNS address you want to resolve.
        const addr = '/ipns/ipfs.io'

        const node = await IPFS.create();
        for await (const name of node.name.resolve(addr)) {
            console.log(name);
            // /ipfs/QmQrX8hka2BtNHa8N8arAq16TCVx5qHcb46c5yPewRycLm
        }
    }
    private async spawnWebsocketTest() {
        const nc1 = await connect({ servers: ["wss://mux.lunchgamer.com"]});
        const nc2 = await connect({ servers: ["wss://mux.lunchgamer.com"]});

        const sc = StringCodec();

        const sub = nc1.subscribe("hello");
        (async () => {
            for await (const m of sub) {
                console.log(`[${sub.getProcessed()}]: ${sc.decode(m.data)}`);
            }
            console.log("subscription closed");
        })().then(() => {
            console.log("exit subscription");
        });

        nc2.publish("hello", sc.encode("world"));
        
        await nc1.close();
        await nc2.close();

        console.log("conn2 established");
    }
}

export default new DefaultSceneWithTexture();
