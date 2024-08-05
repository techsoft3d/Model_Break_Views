async function modelBreakViewDemo() {
    try {

        hwv.view.setTransparencyMode(Communicator.TransparencyMode.Unsorted);

        hwv.view.getNavCube().enable();
        await hwv.view.getNavCube().setAnchor(Communicator.OverlayAnchor.UpperRightCorner);

        const subtreeConfig = new Communicator.LoadSubtreeConfig();
        subtreeConfig.ignoreCadViews = true;

        hwv.pauseRendering();

        let mainModel = hwv.model.createNode(hwv.model.getAbsoluteRootNode(), "Collection");

        let model1 = await hwv.model.loadSubtreeFromScsFile(mainModel, 'models/Tubing_assembly.scs');

        await hwv.model.setViewAxes(new Communicator.Point3(0,-1,0), new Communicator.Point3(0,0,1));
        hwv.view.setViewOrientation(Communicator.ViewOrientation.Iso, 0);
        hwv.view.getAxisTriad().enable();

        hwv.resumeRendering();

        // Set up model break manager:
        const modelBreakManager = new ModelBreakManager(hwv);

        // Attach it to the window for console interaction:
        window.modelBreakManager = modelBreakManager;

        // Activate the Model Break Manager when a break axis is selected:
        document.getElementById("modelBreakPlane").addEventListener("click", async (e)=>{

            const breakPlane = e.target.value;

            if (breakPlane === "noBreak") {
                modelBreakManager.clear();
                return;
            }

            try {
                await modelBreakManager.activate(breakPlane);
            }
            catch(error) {
                console.log('Error in model break manager activation:');
                console.log(error);
            }
            
        });

        // Perform the break:
        document.getElementById("modelBreakBtn").addEventListener("click", ()=>{

            // Show the loading element:
            document.getElementById("loadingDiv").style.display = "inline";
            
            // Execute the break immediately and hide the "loading" display when done:
            setTimeout(()=>{
                let showFaces = false;
                if (document.getElementById("showFacesCheckbox").checked) {
                    showFaces = true;
                }
                modelBreakManager.break(showFaces).then((viewId)=>{
                    document.getElementById("loadingDiv").style.display = "none";
                    
                    if (viewId === undefined) return;
                    
                    console.log("View ID created: " + viewId);
                    let view = document.createElement("p");
                    view.setAttribute("class", "clickable");
                    view.innerHTML = "Break View ID: " + viewId;
                    view.addEventListener("click", ()=>{
                        modelBreakManager.isolate(viewId, 1000);
                    });
                    document.getElementById("savedViews").appendChild(view);

                }).catch((error)=>{
                    console.log("Model break failed:");
                    console.log(error);
                });
            }, 0);  

        });   

        // Reset button:
        document.getElementById("resetBtn").addEventListener("click", async() => {
            await hwv.view.isolateNodes([parseInt(mainModel)]);
        });

        // Measure button:
        const measureOp = new MeasureBreakViewOperator(hwv, modelBreakManager);

        const measureOpId = hwv.operatorManager.registerCustomOperator(measureOp);

        let measureActive = false;

        document.getElementById("measureBtn").addEventListener("click", () => {
            if (!measureActive) {
                hwv.operatorManager.push(measureOpId);
                hwv.getViewElement().style.cursor = "crosshair";
                measureActive = true;
                document.getElementById("measureBtn").style.fontWeight = "bold";
                document.getElementById("measureBtn").style.backgroundColor = "rgb(100,255,100)";
            }
            else {
                hwv.operatorManager.remove(measureOpId);
                hwv.getViewElement().style.cursor = "default";
                measureActive = false;
                document.getElementById("measureBtn").style.fontWeight = "normal";
                document.getElementById("measureBtn").style.backgroundColor = "rgb(240,240,240)";
            }
            
        });

        // Load multiple models:
        document.getElementById("loadMultipleBtn").addEventListener("click", async () => {
            
            try {
                let model2 = await hwv.model.loadSubtreeFromScsFile(mainModel, 'models/Tubing_assembly.scs');
                let model3 = await hwv.model.loadSubtreeFromScsFile(mainModel, 'models/Tubing_assembly.scs');
                let model4 = await hwv.model.loadSubtreeFromScsFile(mainModel, 'models/Tubing_assembly.scs');
                let model5 = await hwv.model.loadSubtreeFromScsFile(mainModel, 'models/Tubing_assembly.scs');
                
                await hwv.model.setNodeMatrix(model2[0], hwv.model.getNodeNetMatrix(model2[0]).setTranslationComponent(0,200,0));
                await hwv.model.setNodeMatrix(model3[0], hwv.model.getNodeNetMatrix(model3[0]).setTranslationComponent(0,-200,0));
                await hwv.model.setNodeMatrix(model4[0], hwv.model.getNodeNetMatrix(model4[0]).setTranslationComponent(0,400,0));
                await hwv.model.setNodeMatrix(model5[0], hwv.model.getNodeNetMatrix(model5[0]).setTranslationComponent(0,-400,0));

                await hwv.view.isolateNodes([parseInt(mainModel)]);

                document.getElementById("loadMultipleBtn").style.display = "none";
            }
            catch(error) {
                console.log("Error loading multiple models:");
                console.log(error);
            }
        
        });

    }
    catch(err){
        console.log("Error:");
        console.log(err);
    }
    

    
}