class BreakTool {
    #center;
    #length;
    #width;
    #height;
    #jaggedEdgeThickness;
    #orientation;
    #csgBreakTool;
    #cutPlaneOnly;

    constructor(center, length, width, height, jaggedEdgeThickness, orientation, cutPlaneOnly = false) {
        this.#center = center;
        this.#length = length;
        this.#width = width;
        this.#height = height;

        this.#jaggedEdgeThickness = jaggedEdgeThickness; 
        this.#orientation = orientation;

        this.#cutPlaneOnly = cutPlaneOnly;

        this.#csgBreakTool = this.#create();

        /*

        Break tool geometry:

                     length     <-JET->*
                ___________________                 
              /                   / \ 
             /___________________/   \
             |                   \   /
             |                    \ /
   height    |                    // 
             |                   //
             |                  / \
             |                 /   \ 
             |                 \   /
             |__________________\ /   width        
     
             *JET = jaggedEdgeThickness


        
        In this sample, the "break tool" is a cube with a jagged edge on one side (the side used to "break" the model using boolean intersection).
        */
    }

    show() {
        return this.#csgBreakTool;
    }

    #create() {

        // Define vertices
        let v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12;

        // Define normals:
        let n1, n2, n3, n4, n5, n6, n7, n8;

        // There are 6 possible orientations (which face of a cube is broken):
        switch (this.#orientation) {
            case "Right":
            v1 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
            v2 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
            v3 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
            v4 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
            v5 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
            v6 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
            v7 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
            v8 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
            v9 = [this.#center.x+this.#length/2+this.#jaggedEdgeThickness/2, this.#center.y-this.#width/2, this.#center.z-this.#height/4];
            v10 = [this.#center.x+this.#length/2+this.#jaggedEdgeThickness/2, this.#center.y+this.#width/2, this.#center.z-this.#height/4];
            v11 = [this.#center.x+this.#length/2-this.#jaggedEdgeThickness/2, this.#center.y-this.#width/2, this.#center.z+this.#height/4];
            v12 = [this.#center.x+this.#length/2-this.#jaggedEdgeThickness/2, this.#center.y+this.#width/2, this.#center.z+this.#height/4];
    
            n1 = [0,-1,0];
            n2 = [0,1,0];
            n3 = [0,0,1];
            n4 = [0,0,-1];
            n5 = [-1,0,0];
            
            n6 = [this.#height/4, 0, -this.#jaggedEdgeThickness/2];
            n7=[this.#height/4, 0, this.#jaggedEdgeThickness/2];
            n8=n6;
    
            break;
    
            case "Left":
            v1 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
            v2 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
            v3 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
            v4 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
    
            v5 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
            v6 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
            v7 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
            v8 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
    
            v9  = [this.#center.x-this.#length/2-this.#jaggedEdgeThickness/2, this.#center.y-this.#width/2, this.#center.z+this.#height/4];
            v10 = [this.#center.x-this.#length/2-this.#jaggedEdgeThickness/2, this.#center.y+this.#width/2, this.#center.z+this.#height/4];
            v11 = [this.#center.x-this.#length/2+this.#jaggedEdgeThickness/2, this.#center.y-this.#width/2, this.#center.z-this.#height/4];
            v12 = [this.#center.x-this.#length/2+this.#jaggedEdgeThickness/2, this.#center.y+this.#width/2, this.#center.z-this.#height/4];
    
            n1 = [0,-1,0];
            n2 = [0,1,0];
            n3 = [0,0,-1];
            n4 = [0,0,1];
            n5 = [1,0,0];
    
            n6 = [-this.#height/4, 0, this.#jaggedEdgeThickness/2];
            n7=[-this.#height/4, 0, -this.#jaggedEdgeThickness/2];
            n8=n6;
    
            break;
    
            case "Top":
            v1 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
            v2 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
            v3 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
            v4 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
    
            v5 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
            v6 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
            v7 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
            v8 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
    
            v9  = [this.#center.x+this.#length/4, this.#center.y-this.#width/2, this.#center.z+this.#height/2+this.#jaggedEdgeThickness/2];
            v10 = [this.#center.x+this.#length/4, this.#center.y+this.#width/2, this.#center.z+this.#height/2+this.#jaggedEdgeThickness/2];
            v11 = [this.#center.x-this.#length/4, this.#center.y-this.#width/2, this.#center.z+this.#height/2-this.#jaggedEdgeThickness/2];
            v12 = [this.#center.x-this.#length/4, this.#center.y+this.#width/2, this.#center.z+this.#height/2-this.#jaggedEdgeThickness/2];
    
            n1 = [0,-1,0];
            n2 = [0,1,0];
            n3 = [-1,0,0];
            n4 = [1,0,0];
            n5 = [0,0,-1];
    
            n6 = [this.#jaggedEdgeThickness/2,0,this.#length/4];
            n7= [-this.#jaggedEdgeThickness/2,0,this.#length/4];
            n8=n6;
    
            break;
    
            case "Bottom":
            v1 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
            v2 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
            v3 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
            v4 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
    
            v5 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
            v6 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
            v7 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
            v8 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
    
            v9  = [this.#center.x-this.#length/4, this.#center.y-this.#width/2, this.#center.z-this.#height/2-this.#jaggedEdgeThickness/2];
            v10 = [this.#center.x-this.#length/4, this.#center.y+this.#width/2, this.#center.z-this.#height/2-this.#jaggedEdgeThickness/2];
            v11 = [this.#center.x+this.#length/4, this.#center.y-this.#width/2, this.#center.z-this.#height/2+this.#jaggedEdgeThickness/2];
            v12 = [this.#center.x+this.#length/4, this.#center.y+this.#width/2, this.#center.z-this.#height/2+this.#jaggedEdgeThickness/2];
    
            n1 = [0,-1,0];
            n2 = [0,1,0];
            n3 = [1,0,0];
            n4 = [-1,0,0];
            n5 = [0,0,1];
    
            n6 = [-this.#jaggedEdgeThickness/2,0,-this.#length/4];
            n7 = [this.#jaggedEdgeThickness/2,0,-this.#length/4];
            n8=n6;
    
            break;
    
            case "Front":
    
            v8 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
            v7 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
            v6 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
            v5 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
    
            v4 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
            v3 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
            v2 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
            v1 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
    
            v9 =  [this.#center.x+this.#length/2, this.#center.y-this.#width/2-this.#jaggedEdgeThickness/2, this.#center.z+this.#height/4];
            v10 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2-this.#jaggedEdgeThickness/2, this.#center.z+this.#height/4];
            v11 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2+this.#jaggedEdgeThickness/2, this.#center.z-this.#height/4];
            v12 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2+this.#jaggedEdgeThickness/2, this.#center.z-this.#height/4];
    
            n1 = [1,0,0];
            n2 = [-1,0,0];
            n3 = [0,0,-1];
            n4 = [0,0,1];
            n5 = [0,1,0];
            
            n6 = [0,-this.#height/4,-this.#jaggedEdgeThickness/22];
            n7 = [0,-this.#height/4,this.#jaggedEdgeThickness/22];
            n8=n6;
    
            break;
    
            case "Back":
            v1 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
            v2 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
            v3 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
            v4 = [this.#center.x+this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
    
            v5 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z-this.#height/2];
            v6 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z-this.#height/2];
            v7 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2, this.#center.z+this.#height/2];
            v8 = [this.#center.x-this.#length/2, this.#center.y-this.#width/2, this.#center.z+this.#height/2];
    
            v9 =  [this.#center.x+this.#length/2, this.#center.y+this.#width/2+this.#jaggedEdgeThickness/2, this.#center.z-this.#height/4];
            v10 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2+this.#jaggedEdgeThickness/2, this.#center.z-this.#height/4];
            v11 = [this.#center.x+this.#length/2, this.#center.y+this.#width/2-this.#jaggedEdgeThickness/2, this.#center.z+this.#height/4];
            v12 = [this.#center.x-this.#length/2, this.#center.y+this.#width/2-this.#jaggedEdgeThickness/2, this.#center.z+this.#height/4];
    
            n1 = [1,0,0];
            n2 = [-1,0,0];
            n3 = [0,0,1];
            n4 = [0,0,-1];
            n5 = [0,-1,0];
    
            n6 = [0, this.#height/4, this.#jaggedEdgeThickness/2];
            n7 = [0, this.#height/4, -this.#jaggedEdgeThickness/2];
            n8=n6;
    
            break;
    
            default:
                alert("Invalid orientation selected.");
            
        }
    
        // Define the faces in terms of CSG (csg.js):
    
        let face1 = new CSG.Polygon([
            new CSG.Vertex(new CSG.Vector(v1), n1),
            new CSG.Vertex(new CSG.Vector(v2), n1),
            new CSG.Vertex(new CSG.Vector(v9), n1),
            new CSG.Vertex(new CSG.Vector(v11), n1),
            new CSG.Vertex(new CSG.Vector(v3), n1),
            new CSG.Vertex(new CSG.Vector(v4), n1),
        ], true);
    
        let face2 = new CSG.Polygon([
            new CSG.Vertex(new CSG.Vector(v5), n2),
            new CSG.Vertex(new CSG.Vector(v8), n2),
            new CSG.Vertex(new CSG.Vector(v7), n2),
            new CSG.Vertex(new CSG.Vector(v12), n2),
            new CSG.Vertex(new CSG.Vector(v10), n2),
            new CSG.Vertex(new CSG.Vector(v6), n2),
        ], true);
    
        let face3 = new CSG.Polygon([
            new CSG.Vertex(new CSG.Vector(v7), n3),
            new CSG.Vertex(new CSG.Vector(v8), n3),
            new CSG.Vertex(new CSG.Vector(v4), n3),
            new CSG.Vertex(new CSG.Vector(v3), n3),
        ], true);
    
        let face4 = new CSG.Polygon([
            new CSG.Vertex(new CSG.Vector(v1), n4),
            new CSG.Vertex(new CSG.Vector(v5), n4),
            new CSG.Vertex(new CSG.Vector(v6), n4),
            new CSG.Vertex(new CSG.Vector(v2), n4),
        ], true);
    
        let face5 = new CSG.Polygon([
            new CSG.Vertex(new CSG.Vector(v4), n5),
            new CSG.Vertex(new CSG.Vector(v8), n5),
            new CSG.Vertex(new CSG.Vector(v5), n5),
            new CSG.Vertex(new CSG.Vector(v1), n5),
        ], true);
        
        let face6 = new CSG.Polygon([
            new CSG.Vertex(new CSG.Vector(v2), n6),
            new CSG.Vertex(new CSG.Vector(v6), n6),
            new CSG.Vertex(new CSG.Vector(v10), n6),
            new CSG.Vertex(new CSG.Vector(v9), n6),
        ], true);
    
        let face7 = new CSG.Polygon([
            new CSG.Vertex(new CSG.Vector(v9), n7),
            new CSG.Vertex(new CSG.Vector(v10), n7),
            new CSG.Vertex(new CSG.Vector(v12), n7),
            new CSG.Vertex(new CSG.Vector(v11), n7),
        ], true);
        
        let face8 = new CSG.Polygon([
            new CSG.Vertex(new CSG.Vector(v11), n8),
            new CSG.Vertex(new CSG.Vector(v12), n8),
            new CSG.Vertex(new CSG.Vector(v7), n8),
            new CSG.Vertex(new CSG.Vector(v3), n8),
        ], true);
    

        let toolPolygons;

        if (this.#cutPlaneOnly) {
            toolPolygons = [
                face6,
                face7,
                face8,
            ];
        }
        else {
            toolPolygons = [
                face1,
                face2,
                face3,
                face4,
                face5,
                face6,
                face7,
                face8,
            ];
        }
    
        const breakTool = new CSG.fromPolygons(toolPolygons);
    
        return breakTool;


        }
    

    

  }