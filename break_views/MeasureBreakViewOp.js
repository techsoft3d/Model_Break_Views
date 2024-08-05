 // Measurement operator that works with model break views.
 // Based on sample from https://docs.techsoft3d.com/communicator/latest/tutorials/basic-app/advanced-operator.html.

 class MeasureBreakViewOperator {
    constructor(viewer, modelBreakManager) {
        this._hwv = viewer;
        this._mbm = modelBreakManager;
        this._activeIndication = null;
    }

    onMouseMove(event) {
        if (this._activeIndication === null) {
            return;
        }
      
        const config = new Communicator.PickConfig(Communicator.SelectionMask.Face | Communicator.SelectionMask.Line);
        this._hwv.selectionManager.clear();

        this._hwv.view.pickFromPoint(event.getPosition(), config).then((selectionItem) => {
            const measureNode = selectionItem.getNodeId()
            if (measureNode !== null) {
                let position = selectionItem.getPosition();
                let iNodeMat = new Communicator.Matrix();
                let actualPosition = position;
                // Check if this is a broken node:
                let parents = [measureNode];
                this.getParents(measureNode,parents);
                if (parents.indexOf(this._mbm.showParent()) !== -1) {
                    // Measuring a broken node, take transformation matrix into account:
                    const nodeMat = this._hwv.model.getNodeNetMatrix(measureNode);
                    iNodeMat = nodeMat.inverseAndDeterminant()[0];
                    actualPosition = iNodeMat.transform(position); //
                }
                this._activeIndication.point2 = position;
                this._activeIndication.actualPoint2 = actualPosition;
                this._hwv.markupManager.refreshMarkup();
            }
        });
    }

    onMouseDown(event) {
      event.setHandled(true);
      const config = new Communicator.PickConfig(Communicator.SelectionMask.Face | Communicator.SelectionMask.Line);
      this._hwv.selectionManager.clear();
      this._hwv.view.pickFromPoint(event.getPosition(), config).then((selectionItem) => {
        const measureNode = selectionItem.getNodeId()
            if (measureNode != null) {
                let position = selectionItem.getPosition();
                let actualPosition = position;
                let iNodeMat = new Communicator.Matrix();
                // Check if this is a broken node:
                let parents = [measureNode];
                this.getParents(measureNode,parents);
                if (parents.indexOf(this._mbm.showParent()) !== -1) {
                    // measuring a broken node, take transformation matrix into account:
                    const nodeMat = this._hwv.model.getNodeNetMatrix(measureNode);
                    iNodeMat = nodeMat.inverseAndDeterminant()[0];
                    actualPosition = iNodeMat.transform(position); //
                }
                    

                const markupManager = this._hwv.markupManager;
                
                if (this._activeIndication === null) {
                    
                    this._activeIndication = new DistanceMarkup(this._hwv, position);
                    this._activeIndication.actualPoint1 = actualPosition;
                    markupManager.registerMarkup(this._activeIndication);
                }
                else {
                    this._activeIndication.point2 = position;
                    this._activeIndication.actualPoint2 = actualPosition;
                    this._activeIndication.finalize();
                    this._activeIndication = null;
                }
            }
      });
    }

    onMouseUp(event) {
        event.setHandled(true);
    }

    getParents(nodeId, parentsArray) {
        const parent = this._hwv.model.getNodeParent(nodeId);
        if (parent !== null) {
            parentsArray.push(parent);
            this.getParents(parent, parentsArray);
        }
    }

  
  }

  class DistanceMarkup extends Communicator.Markup.MarkupItem {
    constructor(viewer, point) {
      super();
      this._hwv = viewer;
      this.point1 = point;
      this.point2 = null;
      this.actualPoint1 = null;
      this.actualPoint2 = null;
      this._isFinalized = false;
      this._unitMult = this._hwv.model.getNodeUnitMultiplier(0);
    }

    draw() {
      const view = this._hwv.view;
      if (this.point1 !== null) {
        const circle = new Communicator.Markup.Shapes.Circle();
        let point3d = view.projectPoint(this.point1);
        circle.set(Communicator.Point2.fromPoint3(point3d), 2.0);
        this._hwv.markupManager.getRenderer().drawCircle(circle);
        if (this.point2 !== null) {
          point3d = view.projectPoint(this.point2);
          circle.set(Communicator.Point2.fromPoint3(point3d), 2.0);
          this._hwv.markupManager.getRenderer().drawCircle(circle);

          const line = new Communicator.Markup.Shapes.Line();
          const point3d1 = view.projectPoint(this.point1);
          const point3d2 = view.projectPoint(this.point2);
          line.setP1(point3d1);
          line.setP2(point3d2);
          this._hwv.markupManager.getRenderer().drawLine(line);

          const text = new Communicator.Markup.Shapes.Text();
          text.setFillColor(new Communicator.Color(0,50,100));
          const midpoint = new Communicator.Point3((point3d1.x+point3d2.x)/2,(point3d1.y+point3d2.y)/2,(point3d1.z+point3d2.z)/2)
          text.setText((Communicator.Point3.subtract(this.actualPoint2, this.actualPoint1).length()/this._unitMult).toFixed(1));
          text.setPosition(midpoint);
          this._hwv.markupManager.getRenderer().drawText(text);
        }
      }
    }
    finalize() {
      this._isFinalized = true;
      this._hwv.markupManager.refreshMarkup();
    }
  }