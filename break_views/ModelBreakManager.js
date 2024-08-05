class ModelBreakManager {
    #hwv;
    #isActive;
    #modelBounding;
    #breakPlane;
    #rootNode;
    #manager = new Map();

    constructor(hwv) {
        this.#hwv = hwv;
        this.#isActive = false;
        this.#rootNode = this.#hwv.model.getAbsoluteRootNode();
        this.brokenViewsNode = this.#hwv.model.createNode(this.#rootNode, "Broken Views");
    }

    async activate(breakPlane, planeColor=Communicator.Color.blue()) {
       
        try {
            await this.clear();

            // Temporarily disable cutting since cutting planes are used for the UI:
            this.#hwv.model.setInstanceModifier(Communicator.InstanceModifier.DoNotCut, [this.#rootNode], true);
            
            // Get the model bounding:
            const bounding = await hwv.model.getModelBounding(true,false,true);
            this.#modelBounding = bounding;

            // Create cutting planes in the viewer that will appear at either end of the model.
            // Each plane will be the size of the model.
            // The built-in HOOPS Communicator cutting plane feature provides a simple UI for defining model break locations.

            let axis;
            let midpoint;
  
            let position = bounding.min;
            let position2 = structuredClone(bounding.min);
            
            let planeNormal;
  
            switch(breakPlane) {
              case "xPlane":
                axis = Communicator.Axis.X;
                midpoint = (bounding.max.x - bounding.min.x)/2 + bounding.min.x;
                position2.x = bounding.max.x;
                planeNormal = new Communicator.Point3(-1,0,0);
                break;
              case "yPlane":
                axis = Communicator.Axis.Y;
                midpoint = (bounding.max.y - bounding.min.y)/2 + bounding.min.y;
                position2.y = bounding.max.y;
                planeNormal = new Communicator.Point3(0,-1,0);
                break;
              case "zPlane":
                axis = Communicator.Axis.Z;
                midpoint = (bounding.max.z - bounding.min.z)/2 + bounding.min.z;
                position2.z = bounding.max.z;
                planeNormal = new Communicator.Point3(0,0,-1);
                break;
              default:
                alert("Invalid break plane.");
                return;
            }

            const referenceGeometry = this.#hwv.cuttingManager.createReferenceGeometryFromAxis(axis, bounding);
            const plane = Communicator.Plane.createFromPointAndNormal(position, planeNormal); 
            const plane2 = Communicator.Plane.createFromPointAndNormal(position2, planeNormal);
  
            const cuttingSection = this.#hwv.cuttingManager.getCuttingSection(0);
            cuttingSection.addPlane(plane, referenceGeometry);
            cuttingSection.addPlane(plane2, referenceGeometry);
            cuttingSection.setColor(planeColor);
  
            this.#breakPlane = breakPlane;
  
            await cuttingSection.activate();

            this.#isActive = true;

            // Click and drag the planes to set model break locations.
        }
        catch(error) {
            console.log("Error activating model break:");
            console.log(error);
        }        

    }

    async clear() {
        try {
            await this.#hwv.cuttingManager.clearAllCuttingSections(); 
            this.#hwv.model.setInstanceModifier(Communicator.InstanceModifier.DoNotCut, [this.#rootNode], false); // Enable cutting again.
            this.#isActive = false;
        }
        catch(error) {
            console.log("Model break clear() error:");
            console.log(error);
        }
    }

    async break(showFaces = false) {
        // This sample only allows for one broken section.
        // Two break tools are used to perform boolean intersections on the model.
        // Boolean subtraction is not used because csg.js's subtract method only returns one CSG object
        // instead of two (one CSG for each broken section).

        if (!this.#isActive) {
            alert("Model break manager is not yet activated.");
            return;
        }

        // --- Begin: Define the break tools ---
        const bounding = this.#modelBounding;

        const midpointX = (bounding.max.x - bounding.min.x)/2 + bounding.min.x;
        const midpointY = (bounding.max.y - bounding.min.y)/2 + bounding.min.y;
        const midpointZ = (bounding.max.z - bounding.min.z)/2 + bounding.min.z;

        let toolCenter1 = new Communicator.Point3(midpointX, midpointY,midpointZ);
        let toolCenter2 = toolCenter1.copy();

        let toolLength = Math.abs(bounding.max.x - bounding.min.x);
        let toolWidth = Math.abs(bounding.max.y - bounding.min.y);
        let toolHeight = Math.abs(bounding.max.z - bounding.min.z);

        let buffer = 0; // Additional clearance for boolean operation
        let jaggedEdgeThickness = 0.5; // See BeakTool class definition for diagram

        // Define the broken face for each tool
        let brokenEdge1;
        let brokenEdge2;   

        // Get positions of the break planes:
        const cutSectionCount = this.#hwv.cuttingManager.getCuttingSectionCount();
        for (let i=0; i<cutSectionCount; i++) {
            if (this.#hwv.cuttingManager.getCuttingSection(i).isActive()) {
                // When the active cutting section is found, get the positions of the two cutting planes:
                if (this.#hwv.cuttingManager.getCuttingSection(i).getCount() !== 2) {
                    alert("Too many cutting planes!");
                    return;
                }

                const plane1 = this.#hwv.cuttingManager.getCuttingSection(i).getPlane(0);
                const plane2 = this.#hwv.cuttingManager.getCuttingSection(i).getPlane(1);

                let minPlane = plane1;
                let maxPlane = plane2;

                if (plane1.d > plane2.d) {
                    minPlane = plane2;
                    maxPlane = plane1;
                }
            
                switch (this.#breakPlane) {
                    case "xPlane":
                        buffer = toolLength*.1;
                        jaggedEdgeThickness = Math.min(toolWidth,toolHeight)*0.1;
                        toolWidth += buffer;
                        toolHeight += buffer;
                        toolCenter1.x = minPlane.d - toolLength/2;
                        toolCenter2.x = maxPlane.d + toolLength/2;
                        brokenEdge1 = "Right";
                        brokenEdge2 = "Left";
                        break;
                    case "yPlane":
                        buffer = toolWidth*.1;
                        jaggedEdgeThickness = Math.min(toolLength,toolHeight)*0.1;
                        toolLength += buffer;
                        toolHeight += buffer;
                        toolCenter1.y = minPlane.d - toolWidth/2;
                        toolCenter2.y = maxPlane.d + toolWidth/2;
                        brokenEdge1 = "Back";
                        brokenEdge2 = "Front";
                        break;
                    case "zPlane":
                        buffer = toolHeight*.1;
                        jaggedEdgeThickness = Math.min(toolLength,toolWidth)*0.1;
                        toolWidth += buffer;
                        toolLength += buffer;
                        toolCenter1.z = minPlane.d - toolHeight/2;
                        toolCenter2.z = maxPlane.d + toolHeight/2;
                        brokenEdge1 = "Top";
                        brokenEdge2 = "Bottom";
                        break;
                    default:
                        console.log("Invalid break plane.");
                        return;
                }
                
                break;

            }
        }

       
  
        const breakTool1 = new BreakTool(toolCenter1, toolLength, toolWidth, toolHeight, jaggedEdgeThickness, brokenEdge1);
        const breakTool2 = new BreakTool(toolCenter2, toolLength, toolWidth, toolHeight, jaggedEdgeThickness, brokenEdge2);

        // Generate reference meshes of the faces used to break the model if set:
        let cutFace1, cutFace2;
        if (showFaces) {
            cutFace1 = new BreakTool(toolCenter1, toolLength, toolWidth, toolHeight, jaggedEdgeThickness, brokenEdge1, true);
            cutFace2 = new BreakTool(toolCenter2, toolLength, toolWidth, toolHeight, jaggedEdgeThickness, brokenEdge2, true);
        }

        // --- End: Define the break tools ---

        // The broken "views" will become new nodes in the model hierarchy, so create the hierarchy:

        this.#rootNode = this.#hwv.model.getAbsoluteRootNode();

        const uuid = crypto.randomUUID();

        const breakViewNode = this.#hwv.model.createNode(this.brokenViewsNode, uuid);           
        const breakNode1 = this.#hwv.model.createNode(breakViewNode, "Broken Model 1");
        const breakNode2 = this.#hwv.model.createNode(breakViewNode, "Broken Model 2");

    
        // --- Begin: Perform the break ---

        // Generate all leaf nodes:
        const leafNodes = [];
        this.#getLeafNodes(this.#rootNode, leafNodes);

        // For each leaf node, perform a boolean intersection:
        try {
            for (let i=0; i<leafNodes.length; i++) {
                const netMatrix = this.#hwv.model.getNodeNetMatrix(leafNodes[i]); // Get the transformation matrix.   

                const nodeMesh = await this.#generateCSGMesh(leafNodes[i], netMatrix); // Convert the node mesh to a CSG node.
                
                if (nodeMesh==null){
                    continue; // No mesh data at this node, so move to next node.
                }
                            
                // Intersect the CSG node with the CSG break tool:
                const newMesh1 = nodeMesh.intersect(breakTool1.show());
                
                // Convert the result CSG to a Communicator mesh:
                const newNode1 = await this.#insertMesh(newMesh1, breakNode1);
           
                // Intersect the CSG node with the other CSG break tool for the other broken section:                
                const newMesh2 = nodeMesh.intersect(breakTool2.show());

                // Convert the result CSG to a Communicator mesh:
                const newNode2 = await this.#insertMesh(newMesh2, breakNode2);

                // Apply the color and opacity of the original nodes to the broken view nodes:
                const originalColor = await this.#hwv.model.getNodesEffectiveFaceColor([leafNodes[i]]);
                let originalOpacity = await this.#hwv.model.getNodesOpacity([leafNodes[i]]);
                if (originalOpacity[0] == null) {
                    originalOpacity = [1.0];
                }
                                
                this.#hwv.model.setNodesFaceColor([newNode1, newNode2], new Communicator.Color(originalColor[0].r, originalColor[0].g, originalColor[0].b));
                this.#hwv.model.setNodesOpacity([newNode1, newNode2], originalOpacity);
                
                
            }
        }
        catch(error) {
            console.log("Model break operation failed:");
            console.log(error);
        }

        // Update the manager:
        this.#manager.set(uuid, breakViewNode);

        // Clear the cut planes:
        await this.clear();

        if (showFaces) {
            await this.#insertMesh(cutFace1.show(), breakNode1, true);
            await this.#insertMesh(cutFace2.show(), breakNode2, true);
        }

        // Set the view:
        await this.#setBrokenView(breakNode1, breakNode2);

        this.#hwv.view.setHardEdgesEnabled(true); // Set hard edges since BRep edges were not preserved.

        return uuid;

    }

    getNode(uuid) {
        return this.#manager.get(uuid);
    }

    getId(node) {
        for (const [key, value] of this.#manager.entries()) {
            if (value === node)
                return key;
        }
        return undefined;
    }

    showParent() {
        return this.brokenViewsNode;
    }

    async isolate(uuid, time) {
        try {
            await this.#hwv.view.isolateNodes([this.#manager.get(uuid)], time, true);
        }
        catch(error) {
            console.log("Error isolating broken nodes:");
            console.log(error);
        }
    }

    #getLeafNodes(node, leafNodes) { // This function creates an array of leaf nodes.
        if (node === this.brokenViewsNode) {
            // Don't try to cut the already broken views
            return;
        }
        const nodeChildren = this.#hwv.model.getNodeChildren(node);
        if ((nodeChildren.length == 0) && (this.#hwv.model.getNodeType(node) === Communicator.NodeType.Body || 
            this.#hwv.model.getNodeType(node) === Communicator.NodeType.BodyInstance ||
            this.#hwv.model.getNodeType(node) === Communicator.NodeType.BrepBody ||
            this.#hwv.model.getNodeType(node) === Communicator.NodeType.Part ||
            this.#hwv.model.getNodeType(node) === Communicator.NodeType.PartInstance ||
            this.#hwv.model.getNodeType(node) === Communicator.NodeType.TessBody)) {
                leafNodes.push(node);
        }

        else {
          for (let i=0; i<nodeChildren.length; i++) {
            this.#getLeafNodes(nodeChildren[i], leafNodes);
          }
        }
    }

    async #generateCSGMesh(nodeId, netMatrix) { // This function creates a CSG object from a Communicator node.
        const originalMesh = await this.#hwv.model.getNodeMeshData(nodeId);
        const polygons = []; // An array of CSG.polygons
        let counter = 0;
        let vertices = [];
        let normals = [];
        let noNormals = false;
      
        if (originalMesh.faces.elementCount == 0) {
            console.log("Error: No faces found on node " + nodeId);
            return null;
        }

        if (originalMesh.faces.hasNormals === false) {
            console.log("Model is missing normals");
            noNormals = true;
        }

        for (const element of originalMesh.faces) {
            counter++;
            let coords = [];
            let normCoords = [];

            // Get x, y, z and apply the net transform
            for (let i=0; i<3; i++) { 
                coords.push(element.position[i]);
                if (!noNormals) {
                normCoords.push(element.normal[i]);
                }
                else {
                normCoords.push([0,0,0]);
                }             
            }
            const point = new Communicator.Point3(coords[0],coords[1],coords[2]);
            let transformedPoint = netMatrix.transform(point);

            const normVector = new Communicator.Point3(normCoords[0],normCoords[1],normCoords[2]);
            let transformedNormal = (netMatrix.inverseAndDeterminant()[0]).transpose().transform(normVector);

            vertices.push([transformedPoint.x, transformedPoint.y, transformedPoint.z]);
            normals.push([transformedNormal.x, transformedNormal.y, transformedNormal.z]);

            if (counter % 3 == 0) { // Once the three vertices of a triangle are captured, repeat the first vertex to close the triangle 
            
                polygons.push(new CSG.Polygon([
                    new CSG.Vertex(new CSG.Vector(vertices[0]), normals[0]),
                    new CSG.Vertex(new CSG.Vector(vertices[1]), normals[1]),
                    new CSG.Vertex(new CSG.Vector(vertices[2]), normals[2])
                ], true));
                
                vertices = [];
                normals = [];

            }
        }
       
        const solid = CSG.fromPolygons(polygons);
      
        return solid;
    }


    async #insertMesh(newMesh, parentNode, cutFace = false) {
        let meshData = new Communicator.MeshData();
        let faces = [];
        let vertNormals = [];
        
        for(let i=0; i<newMesh.polygons.length; i++) {
            const lineArr = [];
            
            const numVertices = newMesh.polygons[i].vertices.length; // CSG object faces may be polygons other than triangles.
            for (let j=0; j<3; j++) { //get the first three vertices
                faces.push(
                    newMesh.polygons[i].vertices[j].pos.x, 
                    newMesh.polygons[i].vertices[j].pos.y, 
                    newMesh.polygons[i].vertices[j].pos.z
                );

                vertNormals.push(
                    newMesh.polygons[i].vertices[j].normal.x, 
                    newMesh.polygons[i].vertices[j].normal.y, 
                    newMesh.polygons[i].vertices[j].normal.z
                );

                lineArr.push(
                    newMesh.polygons[i].vertices[j].pos.x, 
                    newMesh.polygons[i].vertices[j].pos.y, 
                    newMesh.polygons[i].vertices[j].pos.z
                );
            }
            for (let j=3; j<numVertices; j++) {
                faces.push(
                    newMesh.polygons[i].vertices[0].pos.x, 
                    newMesh.polygons[i].vertices[0].pos.y, 
                    newMesh.polygons[i].vertices[0].pos.z
                );
                faces.push(
                    newMesh.polygons[i].vertices[j-1].pos.x, 
                    newMesh.polygons[i].vertices[j-1].pos.y, 
                    newMesh.polygons[i].vertices[j-1].pos.z
                );
                faces.push(
                    newMesh.polygons[i].vertices[j].pos.x, 
                    newMesh.polygons[i].vertices[j].pos.y, 
                    newMesh.polygons[i].vertices[j].pos.z
                );

                vertNormals.push(
                    newMesh.polygons[i].vertices[0].normal.x, 
                    newMesh.polygons[i].vertices[0].normal.y,
                    newMesh.polygons[i].vertices[0].normal.z
                );
                vertNormals.push(
                    newMesh.polygons[i].vertices[j-1].normal.x, 
                    newMesh.polygons[i].vertices[j-1].normal.y, 
                    newMesh.polygons[i].vertices[j-1].normal.z
                );
                vertNormals.push(
                    newMesh.polygons[i].vertices[j].normal.x, 
                    newMesh.polygons[i].vertices[j].normal.y, 
                    newMesh.polygons[i].vertices[j].normal.z
                );

                lineArr.push(
                    newMesh.polygons[i].vertices[j].pos.x, 
                    newMesh.polygons[i].vertices[j].pos.y, 
                    newMesh.polygons[i].vertices[j].pos.z
                );
            }
            
            // Close the polygon:
            lineArr.push(
                newMesh.polygons[i].vertices[0].pos.x, 
                newMesh.polygons[i].vertices[0].pos.y,
                newMesh.polygons[i].vertices[0].pos.z
            );
             
            if (cutFace) {
                //meshData.addPolyline(lineArr);
                meshData.setBackfacesEnabled(true);         
            }
          }
         
        meshData.addFaces(faces, vertNormals);
          
        try {
            const meshId = await this.#hwv.model.createMesh(meshData);
            let meshInstanceData = new Communicator.MeshInstanceData(meshId);
            meshInstanceData.setLineColor(new Communicator.Color(0,0,0));
            if (cutFace) {
                meshInstanceData.setFaceColor(new Communicator.Color(100,100,100));
                meshInstanceData.setOpacity(0.2);
            }
            const newNodeId = await this.#hwv.model.createMeshInstance(meshInstanceData,parentNode,null,false); 
            return newNodeId;
        }
          catch(error){
            console.log("Communicator mesh creation from CSG failed:");
            console.log(error);
        }
    }

    async #setBrokenView(node1, node2) {  // This function translates one broken section closer to the other given two broken sections.
        try {
            // Get the bounds of the two broken sections:
            let boundsBroken1 = await this.#hwv.model.getNodesBounding([node2],{tightBounding: true});
            let boundsBroken2 = await this.#hwv.model.getNodesBounding([node1],{tightBounding: true});
            

            // Get the translation distance depending on the break plane:
            let distance;

            let gap = 0; // Gap between each broken section.

            let translationMat = new Communicator.Matrix();

            switch (this.#breakPlane) {
                case "xPlane":
                    distance = boundsBroken1.min.x - boundsBroken2.max.x;
                    gap = ((boundsBroken1.max.x-boundsBroken1.min.x) + (boundsBroken2.max.x - boundsBroken2.min.x))*.1;
                    translationMat.setTranslationComponent(-distance+gap, 0, 0);
                    break;
                case "yPlane":
                    distance = boundsBroken1.min.y - boundsBroken2.max.y;  
                    gap = ((boundsBroken1.max.y-boundsBroken1.min.y) + (boundsBroken2.max.y - boundsBroken2.min.y))*.1;
                    translationMat.setTranslationComponent(0, -distance+gap, 0);
                    break;
                case "zPlane":
                    distance = boundsBroken1.min.z - boundsBroken2.max.z;
                    gap = ((boundsBroken1.max.z-boundsBroken1.min.z) + (boundsBroken2.max.z - boundsBroken2.min.z))*.1;
                    translationMat.setTranslationComponent(0, 0, -distance+gap);
                    break;
            }
        
            let newMatrix = Communicator.Matrix.multiply(this.#hwv.model.getNodeNetMatrix(node2), translationMat);
        
            await this.#hwv.model.setNodeMatrix(node2, newMatrix, true);

            await this.#hwv.view.isolateNodes([node1, node2], 0, true);
        }
        catch(error) {
            console.log("Error setting broken view camera:");
            console.log(error);
        }
    }
}