import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { NzModalService } from 'ng-zorro-antd/modal';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class ErrorHandlingService {
    constructor(private router: Router, private modal: NzModalService) { }


    public handleHttpError(error: HttpErrorResponse) {
        const errorMessage = this.getErrorMessage(error);
        this.modal.error({
            nzTitle: errorMessage.title,
            nzContent: errorMessage.text,
            nzOkText: 'Entendido'
        });
        
    }


    public getErrorMessage(error: HttpErrorResponse | any): { icon: 'warning' | 'error' | 'success' | 'info', title: string, text: string } {
        if (!navigator.onLine) {
            return {
                icon: 'warning',
                title: 'Sin Conexión a Internet',
                text: 'No se pudo completar la solicitud, verificar la conexión a Internet.'
            };
        } else if (error.status === 400) {
            return {
                icon: 'error',
                title: 'Solicitud Incorrecta',
                text: 'La solicitud enviada no es válida. Por favor, verifica la información y vuelve a intentarlo.'
            };
        } else if (error.status === 401) {
            return {
                icon: 'error',
                title: 'No Autorizado',
                text: 'Debes iniciar sesión para acceder a este recurso.'
            };
        } else if (error.status === 403) {
            this.router.navigateByUrl(`/dashboard/error-handler`);
            return {
                icon: 'error',
                title: 'Acceso Denegado',
                text: 'No cuentas con los permisos para acceder a este recurso.'
            };
        } else if (error.status === 404) {
            return {
                icon: 'error',
                title: 'Recurso No Encontrado',
                text: 'El recurso al que intentas acceder no existe.'
            };
        } else if (error.status === 408 || error.status === 504) {
            return {
                icon: 'error',
                title: 'Tiempo de Espera Agotado',
                text: 'La solicitud ha tardado demasiado tiempo en completarse. Inténtalo nuevamente más tarde.'
            };
        } else if (error.status === 422) {
            console.log(error.error.errors)
            return {
                icon: 'error',
                title: 'Error de Validación',
                text: error.error.errors || 'Hubo un error de validación con los datos enviados. Por favor, revisa la información proporcionada.'
            };
        } else if (error.status >= 500) {
            return {
                icon: 'error',
                title: 'Error en el Servidor',
                text: 'Ocurrió un problema con el servidor. Inténtalo más tarde.'
            };
        } else if (error.status === 429) {
            return {
                icon: 'error',
                title: 'Demasiadas Solicitudes',
                text: 'Se han realizado demasiadas solicitudes en un corto período de tiempo. Por favor, intenta más tarde.'
            };
        } else if (error.status === 409) {
            console.log(error);
            return {
                icon: 'error',
                title: 'Conflicto',
                text: error.error.mensaje || 'Ocurrió un conflicto con la solicitud. Por favor, verifica la información y vuelve a intentarlo.'
            };
        } else {
            return {
                icon: 'error',
                title: 'Error en la Solicitud',
                text: error.message || 'Ocurrió un error desconocido.'
            };
        }
    }


}