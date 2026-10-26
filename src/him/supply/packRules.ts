/** T1 recommendations never silently rewrite edited quantities. */
export const roundPurchaseQuantity=(quantity:number,pack:number)=>Number.isFinite(quantity)&&Number.isFinite(pack)&&pack>0&&quantity>=0 ? Math.ceil(quantity/pack)*pack : NaN;
export const validPurchasePack=(quantity:number,pack:number)=>Number.isFinite(quantity)&&quantity>0&&Number.isFinite(pack)&&pack>0&&Math.abs(roundPurchaseQuantity(quantity,pack)-quantity)<1e-9;
