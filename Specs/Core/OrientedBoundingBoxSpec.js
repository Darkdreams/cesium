/*global defineSuite*/
defineSuite([
        'Core/OrientedBoundingBox',
        'Core/BoundingRectangle',
        'Core/Cartesian3',
        'Core/Cartesian4',
        'Core/Ellipsoid',
        'Core/EllipsoidTangentPlane',
        'Core/Intersect',
        'Core/Math',
        'Core/Matrix3',
        'Core/Plane',
        'Core/Quaternion',
        'Core/Rectangle'
    ], function(
        OrientedBoundingBox,
        BoundingRectangle,
        Cartesian3,
        Cartesian4,
        Ellipsoid,
        EllipsoidTangentPlane,
        Intersect,
        CesiumMath,
        Matrix3,
        Plane,
        Quaternion,
        Rectangle) {
    "use strict";
    /*global jasmine,describe,xdescribe,it,xit,expect,beforeEach,afterEach,beforeAll,afterAll,spyOn*/

    var positions = [
        new Cartesian3(2.0, 0.0, 0.0),
        new Cartesian3(0.0, 3.0, 0.0),
        new Cartesian3(0.0, 0.0, 4.0),
        new Cartesian3(-2.0, 0.0, 0.0),
        new Cartesian3(0.0, -3.0, 0.0),
        new Cartesian3(0.0, 0.0, -4.0)
    ];

    var positions2 = [
        new Cartesian3(4.0, 0.0, 0.0),
        new Cartesian3(0.0, 3.0, 0.0),
        new Cartesian3(0.0, 0.0, 2.0),
        new Cartesian3(-4.0, 0.0, 0.0),
        new Cartesian3(0.0, -3.0, 0.0),
        new Cartesian3(0.0, 0.0, -2.0)
    ];

    function rotatePositions(positions, axis, angle) {
        var points = [];

        var quaternion = Quaternion.fromAxisAngle(axis, angle);
        var rotation = Matrix3.fromQuaternion(quaternion);

        for (var i = 0; i < positions.length; ++i) {
            points.push(Matrix3.multiplyByVector(rotation, positions[i], new Cartesian3()));
        }

        return {
            points : points,
            rotation : rotation
        };
    }

    function translatePositions(positions, translation) {
        var points = [];
        for (var i = 0; i < positions.length; ++i) {
            points.push(Cartesian3.add(translation, positions[i], new Cartesian3()));
        }

        return points;
    }

    it('constructor sets expected default values', function() {
        var box = new OrientedBoundingBox();
        expect(box.center).toEqual(Cartesian3.ZERO);
        expect(box.halfAxes).toEqual(Matrix3.ZERO);
    });

    it('fromBoundingRectangle throws without rectangle', function() {
        expect(function() {
            OrientedBoundingBox.fromBoundingRectangle();
        }).toThrowDeveloperError();
    });

    it('fromBoundingRectangle returns zero-size OrientedBoundingBox given a zero-size BoundingRectangle', function() {
        var box = OrientedBoundingBox.fromBoundingRectangle(new BoundingRectangle());
        expect(box.center).toEqual(Cartesian3.ZERO);
        expect(box.halfAxes).toEqual(Matrix3.ZERO);
    });

    it('fromBoundingRectangle creates an OrientedBoundingBox without a result parameter', function() {
        var rect = new BoundingRectangle(1.0, 2.0, 3.0, 4.0);
        var angle = CesiumMath.PI_OVER_TWO;
        var box = OrientedBoundingBox.fromBoundingRectangle(rect, angle);
        var rotation = Matrix3.fromRotationZ(angle);
        expect(box.center).toEqual(new Cartesian3(-1.0, 3.5, 0.0));

        var rotScale = new Matrix3();
        Matrix3.multiply(rotation, Matrix3.fromScale(new Cartesian3(1.5, 2.0, 0.0)), rotScale);
        expect(box.halfAxes).toEqualEpsilon(rotScale, CesiumMath.EPSILON15);
    });

    it('fromBoundingRectangle creates an OrientedBoundingBox with a result parameter', function() {
        var rect = new BoundingRectangle(1.0, 2.0, 3.0, 4.0);
        var angle = CesiumMath.PI_OVER_TWO;
        var result = new OrientedBoundingBox();
        var box = OrientedBoundingBox.fromBoundingRectangle(rect, angle, result);
        expect(box).toBe(result);
        var rotation = Matrix3.fromRotationZ(angle);

        expect(box.center).toEqual(new Cartesian3(-1.0, 3.5, 0.0));

        var rotScale = new Matrix3();
        Matrix3.multiply(rotation, Matrix3.fromScale(new Cartesian3(1.5, 2.0, 0.0)), rotScale);
        expect(box.halfAxes).toEqualEpsilon(rotScale, CesiumMath.EPSILON15);
    });

    it('fromRectangleTangentPlane throws without rectangle', function() {
        var pl = new EllipsoidTangentPlane(Cartesian3.UNIT_X, Ellipsoid.UNIT_SPHERE);
        expect(function() {
            return OrientedBoundingBox.fromRectangleTangentPlane(undefined, pl, 0.0, 0.0);
        }).toThrowDeveloperError();
    });

    it('fromRectangleTangentPlane throws without tangentPlane', function() {
        var rect = new BoundingRectangle(1.0, 2.0, 3.0, 4.0);
        expect(function() {
            return OrientedBoundingBox.fromRectangleTangentPlane(rect, undefined, 0.0, 0.0);
        }).toThrowDeveloperError();
    });

    it('fromRectangleTangentPlane creates an OrientedBoundingBox without a result parameter', function() {
        var rect = new Rectangle(0.0, 0.0, 0.0, 0.0);
        var pl = new EllipsoidTangentPlane(Cartesian3.UNIT_X, Ellipsoid.UNIT_SPHERE);
        var box = OrientedBoundingBox.fromRectangleTangentPlane(rect, pl, 0.0, 0.0);

        expect(box.center).toEqualEpsilon(new Cartesian3(1.0, 0.0, 0.0), CesiumMath.EPSILON15);

        var rotScale = Matrix3.ZERO;
        expect(box.halfAxes).toEqualEpsilon(rotScale, CesiumMath.EPSILON15);
    });

    it('fromRectangleTangentPlane creates an OrientedBoundingBox with a result parameter', function() {
        var rect = new Rectangle(0.0, 0.0, 0.0, 0.0);
        var pl = new EllipsoidTangentPlane(Cartesian3.UNIT_X, Ellipsoid.UNIT_SPHERE);
        var result = new OrientedBoundingBox();
        var box = OrientedBoundingBox.fromRectangleTangentPlane(rect, pl, 0.0, 0.0, result);
        expect(box).toBe(result);

        expect(box.center).toEqualEpsilon(new Cartesian3(1.0, 0.0, 0.0), CesiumMath.EPSILON15);

        var rotScale = Matrix3.ZERO;
        expect(box.halfAxes).toEqualEpsilon(rotScale, CesiumMath.EPSILON15);
    });

    it('fromRectangleTangentPlane from a degenerate rectangle from (-45, 0) to (45, 0)', function() {
        var d45 = CesiumMath.PI_OVER_FOUR;
        var rect = new Rectangle(-d45, 0.0, d45, 0.0);
        var pl = new EllipsoidTangentPlane(Cartesian3.UNIT_X, Ellipsoid.UNIT_SPHERE);
        var result = new OrientedBoundingBox();
        var box = OrientedBoundingBox.fromRectangleTangentPlane(rect, pl, 0.0, 0.0, result);
        expect(box).toBe(result);

        expect(box.center).toEqualEpsilon(new Cartesian3((1.0 + Math.SQRT1_2) / 2.0, 0.0, 0.0), CesiumMath.EPSILON15);

        var rotScale = new Matrix3(0.0, 0.0, 0.5 * (1.0 - Math.SQRT1_2), Math.SQRT1_2, 0.0, 0.0, 0.0, 0.0, 0.0);
        expect(box.halfAxes).toEqualEpsilon(rotScale, CesiumMath.EPSILON15);
    });

    it('fromRectangleTangentPlane from a degenerate rectangle from (135, 0) to (-135, 0)', function() {
        var d135 = 3 * CesiumMath.PI_OVER_FOUR;
        var rect = new Rectangle(d135, 0.0, -d135, 0.0);
        var pl = new EllipsoidTangentPlane(new Cartesian3(-1.0, 0.0, 0.0), Ellipsoid.UNIT_SPHERE);
        var result = new OrientedBoundingBox();
        var box = OrientedBoundingBox.fromRectangleTangentPlane(rect, pl, 0.0, 0.0, result);
        expect(box).toBe(result);

        expect(box.center).toEqualEpsilon(new Cartesian3(-(1.0 + Math.SQRT1_2) / 2.0, 0.0, 0.0), CesiumMath.EPSILON15);

        var rotScale = new Matrix3(0.0, 0.0, -0.5 * (1.0 - Math.SQRT1_2), -Math.SQRT1_2, 0.0, 0.0, 0.0, 0.0, 0.0);
        expect(box.halfAxes).toEqualEpsilon(rotScale, CesiumMath.EPSILON15);
    });

    it('fromRectangleTangentPlane from a degenerate rectangle from (0, -45) to (0, 45)', function() {
        var d45 = CesiumMath.PI_OVER_FOUR;
        var rect = new Rectangle(0.0, -d45, 0.0, d45);
        var pl = new EllipsoidTangentPlane(Cartesian3.UNIT_X, Ellipsoid.UNIT_SPHERE);
        var result = new OrientedBoundingBox();
        var box = OrientedBoundingBox.fromRectangleTangentPlane(rect, pl, 0.0, 0.0, result);
        expect(box).toBe(result);

        expect(box.center).toEqualEpsilon(new Cartesian3((1.0 + Math.SQRT1_2) / 2.0, 0.0, 0.0), CesiumMath.EPSILON15);

        var rotScale = new Matrix3(0.0, 0.0, 0.5 * (1.0 - Math.SQRT1_2), 0.0, 0.0, 0.0, 0.0, Math.SQRT1_2, 0.0);
        expect(box.halfAxes).toEqualEpsilon(rotScale, CesiumMath.EPSILON15);
    });

    it('fromRectangleTangentPlane from a degenerate rectangle from (0, 135) to (0, -135)', function() {
        var d135 = 3 * CesiumMath.PI_OVER_FOUR;
        var rect = new Rectangle(0.0, d135, 0.0, -d135);
        var pl = new EllipsoidTangentPlane(new Cartesian3(-1.0, 0.0, 0.0), Ellipsoid.UNIT_SPHERE);
        var result = new OrientedBoundingBox();
        var box = OrientedBoundingBox.fromRectangleTangentPlane(rect, pl, 0.0, 0.0, result);
        expect(box).toBe(result);

        expect(box.center).toEqualEpsilon(new Cartesian3(-(1.0 + Math.SQRT1_2) / 2.0, 0.0, 0.0), CesiumMath.EPSILON15);

        var rotScale = new Matrix3(0.0, 0.0, -0.5 * (1.0 - Math.SQRT1_2), 0.0, 0.0, 0.0, 0.0, -Math.SQRT1_2, 0.0);
        expect(box.halfAxes).toEqualEpsilon(rotScale, CesiumMath.EPSILON15);
    });

    /**
     * @param {Cartesian3} center
     * @param {Matrix3} axes
     */
    var intersectPlaneTestCornersEdgesFaces = function(center, axes) {
        var SQRT1_2 = Math.pow(1.0 / 2.0, 1 / 2.0);
        var SQRT1_3 = Math.pow(1.0 / 3.0, 1 / 2.0);
        var SQRT3_4 = Math.pow(3.0 / 4.0, 1 / 2.0);

        var box = new OrientedBoundingBox(center, Matrix3.multiplyByScalar(axes, 0.5, new Matrix3()));

        var planeNormXform = function(nx, ny, nz, dist) {
            var n = new Cartesian3(nx, ny, nz);
            var arb = new Cartesian3(357, 924, 258);
            var p0 = Cartesian3.normalize(n, new Cartesian3());
            Cartesian3.multiplyByScalar(p0, -dist, p0);
            var tang = Cartesian3.cross(n, arb, new Cartesian3());
            Cartesian3.normalize(tang, tang);
            var binorm = Cartesian3.cross(n, tang, new Cartesian3());
            Cartesian3.normalize(binorm, binorm);

            Matrix3.multiplyByVector(axes, p0, p0);
            Matrix3.multiplyByVector(axes, tang, tang);
            Matrix3.multiplyByVector(axes, binorm, binorm);
            Cartesian3.cross(tang, binorm, n);
            Cartesian3.normalize(n, n);

            Cartesian3.add(p0, center, p0);
            var d = -Cartesian3.dot(p0, n);
            if (Math.abs(d) > 0.0001 && Cartesian3.magnitudeSquared(n) > 0.0001) {
                return new Plane(n, d);
            } else {
                return undefined;
            }
        };

        var pl;


        // Tests against faces

        pl = planeNormXform(+1.0, +0.0, +0.0,  0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(-1.0, +0.0, +0.0,  0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+0.0, +1.0, +0.0,  0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+0.0, -1.0, +0.0,  0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+0.0, +0.0, +1.0,  0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+0.0, +0.0, -1.0,  0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }

        pl = planeNormXform(+1.0, +0.0, +0.0,  0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +0.0, +0.0,  0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, +1.0, +0.0,  0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, -1.0, +0.0,  0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, +0.0, +1.0,  0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, +0.0, -1.0,  0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }

        pl = planeNormXform(+1.0, +0.0, +0.0, -0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +0.0, +0.0, -0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, +1.0, +0.0, -0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, -1.0, +0.0, -0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, +0.0, +1.0, -0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, +0.0, -1.0, -0.49999); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }

        pl = planeNormXform(+1.0, +0.0, +0.0, -0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(-1.0, +0.0, +0.0, -0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+0.0, +1.0, +0.0, -0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+0.0, -1.0, +0.0, -0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+0.0, +0.0, +1.0, -0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+0.0, +0.0, -1.0, -0.50001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }


        // Tests against edges

        pl = planeNormXform(+1.0, +1.0, +0.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+1.0, -1.0, +0.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(-1.0, +1.0, +0.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(-1.0, -1.0, +0.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+1.0, +0.0, +1.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+1.0, +0.0, -1.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(-1.0, +0.0, +1.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(-1.0, +0.0, -1.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+0.0, +1.0, +1.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+0.0, +1.0, -1.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+0.0, -1.0, +1.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+0.0, -1.0, -1.0,  SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }

        pl = planeNormXform(+1.0, +1.0, +0.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, -1.0, +0.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +1.0, +0.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, -1.0, +0.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, +0.0, +1.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, +0.0, -1.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +0.0, +1.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +0.0, -1.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, +1.0, +1.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, +1.0, -1.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, -1.0, +1.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, -1.0, -1.0,  SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }

        pl = planeNormXform(+1.0, +1.0, +0.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, -1.0, +0.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +1.0, +0.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, -1.0, +0.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, +0.0, +1.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, +0.0, -1.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +0.0, +1.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +0.0, -1.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, +1.0, +1.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, +1.0, -1.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, -1.0, +1.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+0.0, -1.0, -1.0, -SQRT1_2 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }

        pl = planeNormXform(+1.0, +1.0, +0.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+1.0, -1.0, +0.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(-1.0, +1.0, +0.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(-1.0, -1.0, +0.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+1.0, +0.0, +1.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+1.0, +0.0, -1.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(-1.0, +0.0, +1.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(-1.0, +0.0, -1.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+0.0, +1.0, +1.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+0.0, +1.0, -1.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+0.0, -1.0, +1.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+0.0, -1.0, -1.0, -SQRT1_2 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }


        // Tests against corners

        pl = planeNormXform(+1.0, +1.0, +1.0,  SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+1.0, +1.0, -1.0,  SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+1.0, -1.0, +1.0,  SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(+1.0, -1.0, -1.0,  SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(-1.0, +1.0, +1.0,  SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(-1.0, +1.0, -1.0,  SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(-1.0, -1.0, +1.0,  SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }
        pl = planeNormXform(-1.0, -1.0, -1.0,  SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INSIDE); }

        pl = planeNormXform(+1.0, +1.0, +1.0,  SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, +1.0, -1.0,  SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, -1.0, +1.0,  SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, -1.0, -1.0,  SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +1.0, +1.0,  SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +1.0, -1.0,  SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, -1.0, +1.0,  SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, -1.0, -1.0,  SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }

        pl = planeNormXform(+1.0, +1.0, +1.0, -SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, +1.0, -1.0, -SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, -1.0, +1.0, -SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(+1.0, -1.0, -1.0, -SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +1.0, +1.0, -SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, +1.0, -1.0, -SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, -1.0, +1.0, -SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }
        pl = planeNormXform(-1.0, -1.0, -1.0, -SQRT3_4 + 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.INTERSECTING); }

        pl = planeNormXform(+1.0, +1.0, +1.0, -SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+1.0, +1.0, -1.0, -SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+1.0, -1.0, +1.0, -SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(+1.0, -1.0, -1.0, -SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(-1.0, +1.0, +1.0, -SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(-1.0, +1.0, -1.0, -SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(-1.0, -1.0, +1.0, -SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }
        pl = planeNormXform(-1.0, -1.0, -1.0, -SQRT3_4 - 0.00001); if (pl) { expect(box.intersectPlane(pl)).toEqual(Intersect.OUTSIDE); }

    };

    it('intersectPlane works with untransformed box', function() {
        intersectPlaneTestCornersEdgesFaces(Cartesian3.ZERO, Matrix3.IDENTITY);
    });

    it('intersectPlane works with off-center box', function() {
        intersectPlaneTestCornersEdgesFaces(new Cartesian3(1.0, 0.0, 0.0), Matrix3.IDENTITY);
        intersectPlaneTestCornersEdgesFaces(new Cartesian3(0.7, -1.8, 12.0), Matrix3.IDENTITY);
    });

    it('intersectPlane works with rotated box', function() {
        intersectPlaneTestCornersEdgesFaces(Cartesian3.ZERO,
                Matrix3.fromQuaternion(Quaternion.fromAxisAngle(new Cartesian3(0.5, 1.5, -1.2), 1.2), new Matrix3()));
    });

    it('intersectPlane works with scaled box', function() {
        var m = new Matrix3();
        intersectPlaneTestCornersEdgesFaces(Cartesian3.ZERO, Matrix3.fromScale(new Cartesian3(1.5, 0.4, 20.6), m));
        intersectPlaneTestCornersEdgesFaces(Cartesian3.ZERO, Matrix3.fromScale(new Cartesian3(0.0, 0.4, 20.6), m));
        intersectPlaneTestCornersEdgesFaces(Cartesian3.ZERO, Matrix3.fromScale(new Cartesian3(1.5, 0.0, 20.6), m));
        intersectPlaneTestCornersEdgesFaces(Cartesian3.ZERO, Matrix3.fromScale(new Cartesian3(1.5, 0.4, 0.0), m));
        intersectPlaneTestCornersEdgesFaces(Cartesian3.ZERO, Matrix3.fromScale(new Cartesian3(0.0, 0.0, 0.0), m));
    });

    it('intersectPlane works with this arbitrary box', function() {
        var m = Matrix3.fromScale(new Cartesian3(1.5, 80.4, 2.6), new Matrix3());
        var n = Matrix3.fromQuaternion(Quaternion.fromAxisAngle(new Cartesian3(0.5, 1.5, -1.2), 1.2), new Matrix3());
        Matrix3.multiply(m, n, n);
        intersectPlaneTestCornersEdgesFaces(new Cartesian3(-5.1, 0.0, 0.1), n);
    });

    it('intersectPlane fails without box parameter', function() {
        var plane = new Cartesian4(1.0, 0.0, 0.0, 0.0);
        expect(function() {
            OrientedBoundingBox.intersectPlane(undefined, plane);
        }).toThrowDeveloperError();
    });

    it('intersectPlane fails without plane parameter', function() {
        var box = new OrientedBoundingBox(Cartesian3.IDENTITY, Matrix3.ZERO);
        expect(function() {
            OrientedBoundingBox.intersectPlane(box, undefined);
        }).toThrowDeveloperError();
    });

    it('clone without a result parameter', function() {
        var box = new OrientedBoundingBox();
        var result = OrientedBoundingBox.clone(box);
        expect(box).not.toBe(result);
        expect(box).toEqual(result);
        expect(box.clone()).toEqual(box);
    });

    it('clone with a result parameter', function() {
        var box = new OrientedBoundingBox();
        var box2 = new OrientedBoundingBox();
        var result = new OrientedBoundingBox();
        var returnedResult = OrientedBoundingBox.clone(box, result);
        expect(result).toBe(returnedResult);
        expect(box).not.toBe(result);
        expect(box).toEqual(result);
        expect(box.clone(box2)).toBe(box2);
        expect(box.clone(box2)).toEqual(box2);
    });

    it('clone undefined OBB with a result parameter', function() {
        var box = new OrientedBoundingBox();
        var box2 = new OrientedBoundingBox();
        expect(OrientedBoundingBox.clone(undefined, box)).toBe(undefined);
    });

    it('clone undefined OBB without a result parameter', function() {
        expect(OrientedBoundingBox.clone(undefined)).toBe(undefined);
    });

    it('equals works in all cases', function() {
        var box = new OrientedBoundingBox();
        expect(box.equals(new OrientedBoundingBox())).toEqual(true);
        expect(box.equals(undefined)).toEqual(false);
    });
});
