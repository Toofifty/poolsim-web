import { Quaternion, Vector2, Vector3 } from 'three';
import type { Quat, Vec } from '../../../common/math';

export const toVec = (v: Vector3): Vec => [v.x, v.y, v.z];
export const toQuat = (q: Quaternion): Quat => [q.w, q.x, q.y, q.z];

export const toQuaternion = (q: Quat) => new Quaternion(q[1], q[2], q[3], q[0]);
export const toVector3 = (v: Vec) => new Vector3(v[0], v[1], v[2]);
export const toVector2 = (v: Vec) => new Vector2(v[0], v[1]);
