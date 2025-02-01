
export type CONFIG_TYPE = {
    oss: {
        type: "ali-oss",
        config: {
            accessKeyId: string,
            accessKeySecret: string,
            bucket: string,
            region: string,
            secure: boolean
        },
        options: any
    }
    uploadConfig: {
        concurrent: number,
        versionControl: "disable" | "manual" | "auto"
    },
    deployConfig:{
        concurrent: number,
        versionUsed: "disable" | "latest"
    },
    remoteSource: string,
    localSource: string,
    deployPath: string,
    include: string[],
    exclude: string[],
    exec: string[]
}