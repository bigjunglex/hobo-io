import { crew } from "@kaplayjs/crew";
import kaplay from 'kaplay';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const k = kaplay({ plugins: [crew], canvas });

//testo
k.loadCrew('sprite', 'mark')
k.add([
    k.sprite('mark'),
    k.pos(300, 300),
    k.body(),
    k.area({shape: new k.Rect(k.vec2(0, 0), 30, 30)})
])



export default k