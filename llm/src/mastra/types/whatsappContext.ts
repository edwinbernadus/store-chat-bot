export type WhatsappContext = {
    message: {
        chat: {
            id: string;
        };
        text: string;
        from?: {
            username?: string;
            first_name?: string;
            id: string;
        };
    }
}

export type WhatsappMessage = {
    StanzaID: string;
    Sender: string;
    Content: string;
    ChatJID: string;
    Name: string;
    IsFromMe: boolean;
    IsGroup: boolean;
}



