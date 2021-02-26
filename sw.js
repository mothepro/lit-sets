var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var version = '0.0.10';
function installer(event) {
    return __awaiter(this, void 0, void 0, function () {
        var cache, images;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, caches.open(version)];
                case 1:
                    cache = _a.sent(), images = [
                        'android-chrome-192x192.png',
                        'android-chrome-256x256.png',
                        'apple-touch-icon.png',
                        'favicon-16x16.png',
                        'favicon-32x32.png',
                        'favicon.ico',
                        'mstile-150x150.png',
                        'safari-pinned-tab.svg',
                    ];
                    return [2 /*return*/, cache.addAll(images)];
            }
        });
    });
}
function fetcher(event) {
    return __awaiter(this, void 0, void 0, function () {
        var response, cache, response_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, caches.match(event.request)];
                case 1:
                    response = _a.sent();
                    if (!!response) return [3 /*break*/, 4];
                    return [4 /*yield*/, caches.open(version)];
                case 2:
                    cache = _a.sent();
                    return [4 /*yield*/, fetch(event.request)];
                case 3:
                    response_1 = _a.sent();
                    if (Math.trunc(response_1.status / 100) != 2)
                        throw Error("Request for \"" + event.request.url + "\" came back with status " + response_1.status);
                    cache.put(event.request, response_1.clone());
                    _a.label = 4;
                case 4: return [2 /*return*/, response];
            }
        });
    });
}
// @ts-ignore
addEventListener('install', function (event) { return event.waitUntil(installer(event)); });
// @ts-ignore
// addEventListener('fetch', (event: FetchEvent) => event.respondWith(fetcher(event)))
