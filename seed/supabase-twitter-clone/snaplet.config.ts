/// <reference path=".snaplet/snaplet.d.ts" />
import {defineConfig} from 'snaplet'

export default defineConfig({
    select: {
        $default: false,
        auth: {
            $default: false,
            users: true,
            identities: true,
            sessions: true,
        },
        public: true,
    }
})