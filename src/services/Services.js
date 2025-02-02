import UserService from './UserService'
import ModelService from './ModelService'
import PublicModelService from './PublicModelService'
import CommentService from './CommentService'
import SymbolService from './SymbolService'
import HelpService from './HelpService'
import ImageService from './ImageService'
import WebSocketService from './WebSocketService'

class Services {

    constructor () {
        this.config = {
            'auth': 'qux',
            'websocket': 'wss://ws.quant-ux.com'
        }
    }

    async initConfig () {
        return new Promise((resolve, reject) => {
            fetch('/config.json', {
                method: 'get',
                credentials: "same-origin"
            }).then((res) => {
                if (res.status === 200) {
                    res.json().then(j => {
                        this.config = j
                        resolve(j)
                    })
                } else {
                    reject(new Error('Could not load config'))
                }
            }).catch((err) => {
                reject(err)
            })
        })
    }

    getConfig() {
        return this.config
    }

    setErrorHandler (handler) {
        this.errorHandler = handler
        ModelService.setErrorHandler(handler)
        PublicModelService.setErrorHandler(handler)
        UserService.setErrorHandler(handler)
        ImageService.setErrorHandler(handler)
    }

    getImageService () {
        ImageService.setToken(this.getUserService().getToken())
        return ImageService
    }

    getWebSocketService (modelId, token, user) {
        if (this.config.websocket) {
            let ws = new WebSocketService(this.config.websocket, modelId, token, user)
            return ws
        }
        return null
    }

    getUserService () {
    
        UserService.setToken(UserService.getToken())
        return UserService
        
    }

    getSymbolService () {
        return SymbolService
    }

    getHelpService () {
        return HelpService
    }

    getModelService (route) {
        if (route && route.meta && route.meta.isPublic) {
            PublicModelService.setToken(this.getUserService().getToken())
            return PublicModelService
        }
        ModelService.setToken(this.getUserService().getToken())
        return ModelService
    }

    getPublicModelService () {
        PublicModelService.setToken(this.getUserService().getToken())
        return PublicModelService
    }

    getCommentService () {
        CommentService.setToken(this.getUserService().getToken())
        return CommentService
    }

}
export default new Services()