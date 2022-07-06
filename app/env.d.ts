declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NEXT_PUBLIC_API_URL: string;
            TMDB_API_KEY: string;
        }
    }
}

export { }