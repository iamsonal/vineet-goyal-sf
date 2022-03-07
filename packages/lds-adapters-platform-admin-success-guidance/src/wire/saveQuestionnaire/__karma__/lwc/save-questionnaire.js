import { api, LightningElement, wire, track } from 'lwc';
import { saveQuestionnaire, getQuestionnaire } from 'lds-adapters-platform-admin-success-guidance';

export default class SaveQuestionnaire extends LightningElement {
    @track questionnaireData;
    @track questionnaireName;
    @track error;

    @wire(getQuestionnaire, {
        questionnaireName: '$questionnaireName',
    })
    questionnaireWireResult;

    @api
    invokeSaveQuestionnaire({ questionnaireData, questionnaireName }) {
        saveQuestionnaire({ questionnaireName, questionnaireData })
            .then((data) => {
                this.questionnaireName = questionnaireName;
                this.questionnaireData = data;
            })
            .catch((error) => {
                this.error = error;
            });
    }

    @api
    getQuestionnaire() {
        return this.questionnaireData;
    }

    @api
    getQuestionnaireWire() {
        return this.questionnaireWireResult && this.questionnaireWireResult.data;
    }

    @api
    getError() {
        return this.error;
    }
}
