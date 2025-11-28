import './css/styles.css';
import k from "./kaplayCtx"

const kaplay = k
const container = document.getElementById('bundled');
if (container) { container.innerHTML = 'HELLO FROM BUNDLE' }
