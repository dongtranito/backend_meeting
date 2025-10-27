import express from "express";
import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import FormData from "form-data";

dotenv.config();
const app = express();
app.use(express.json());

const {
    DOCUSIGN_INTEGRATION_KEY,
    DOCUSIGN_USER_ID,
    DOCUSIGN_ACCOUNT_ID,
    DOCUSIGN_BASE_URL,
    DOCUSIGN_PRIVATE_KEY_PATH,
} = process.env;

async function getAccessToken() {
    const privateKey = fs.readFileSync(DOCUSIGN_PRIVATE_KEY_PATH);
    const jwtPayload = {
        iss: DOCUSIGN_INTEGRATION_KEY,
        sub: DOCUSIGN_USER_ID,
        aud: "account-d.docusign.com",
        scope: "signature",
    };

    const jwtToken = jwt.sign(jwtPayload, privateKey, {
        algorithm: "RS256",
        expiresIn: "10m",
    });

    const res = await axios.post(
        "https://account-d.docusign.com/oauth/token",
        new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwtToken,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return res.data.access_token;
}
async function convertWordToPdfBuffer(urlWord) {
    try {
        const GOTENBERG_URL = process.env.GOTENBERG_URL;
        const resWord = await axios.get(urlWord, { responseType: "arraybuffer" });

        const form = new FormData();
        form.append("files", resWord.data, { filename: "input.docx" });

        const resPdf = await axios.post(
            `${GOTENBERG_URL}/forms/libreoffice/convert`,
            form,
            {
                responseType: "arraybuffer",
                headers: form.getHeaders(),
            }
        );

        return resPdf.data;
    } catch (error) {
        throw new Error(error);
    }
}

export async function sendToDocuSign(wordUrl, signers) {
    try {

        const pdfBuffer = await convertWordToPdfBuffer(wordUrl);

        const accessToken = await getAccessToken();
        const fileBase64 = Buffer.from(pdfBuffer).toString("base64");

        const signersPayload = signers.map((s, index) => ({
            email: s.email,
            name: s.name,
            recipientId: `${index + 1}`,
            routingOrder: "1",
            tabs: {},
            allowRecipientToEditTabs: true,
        }));

        const envelopePayload = {
            emailSubject: "📄 Mời bạn ký tài liệu điện tử",
            documents: [
                {
                    documentBase64: fileBase64,
                    name: "TaiLieu.pdf",
                    fileExtension: "pdf",
                    documentId: "1",
                },
            ],
            recipients: { signers: signersPayload },
            status: "sent",
        };

        const response = await axios.post(
            `${DOCUSIGN_BASE_URL}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`,
            envelopePayload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data.envelopeId;

    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
}


export async function downloadSignedPDF(envelopeId) {
    const accessToken = await getAccessToken();
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
    const baseUrl = process.env.DOCUSIGN_BASE_URL;

    const url = `${baseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/1`;

    const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: "arraybuffer",
    });

    return res.data; // Buffer PDF
}

