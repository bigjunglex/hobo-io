import expess from "express";
import webpack from "webpack";
import { type Configuration } from "webpack"; 
import wdm from "webpack-dev-middleware";

const PORT = process.env.PORT ?? 7878;
const app = expess();
app.use(expess.static('public'));

if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    const config:Configuration = (await import('../../webpack.dev.js')).default;
    console.log(config)
    const compiler = webpack(config);
    app.use(wdm(compiler));
    app.listen(PORT, () => console.log(`[SERVER]: Listening on `, PORT))
}
