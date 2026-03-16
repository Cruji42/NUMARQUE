import { BrowserModule } from '@angular/platform-browser';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

import { registerLocaleData, PathLocationStrategy, LocationStrategy } from '@angular/common';
import en from '@angular/common/locales/en';
import es from '@angular/common/locales/es';

import { AppRoutingModule } from './app-routing.module';
import { TemplateModule } from './shared/template/template.module';
import { SharedModule } from './shared/shared.module';

import { AppComponent } from './app.component';
import { CommonLayoutComponent } from './layouts/common-layout/common-layout.component';
import { FullLayoutComponent } from './layouts/full-layout/full-layout.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';

import { ThemeConstantService } from './shared/services/theme-constant.service';
import { NgChartsModule } from 'ng2-charts';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MessageErrorInterceptor } from './core/utils/message-error.interceptor';
import { HttpClientModule } from '@angular/common/http';
import { NzModalModule } from 'ng-zorro-antd/modal';
// import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

registerLocaleData(en);
registerLocaleData(es);

@NgModule({
    declarations: [
        AppComponent,
        CommonLayoutComponent,
        FullLayoutComponent,
        WelcomeComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        NzBreadCrumbModule,
        TemplateModule,
        SharedModule,
        NgChartsModule,
        HttpClientModule,
        NzModalModule
    ],
    providers: [
        // provideCharts(withDefaultRegisterables()),
        {
            provide: NZ_I18N,
            useValue: en_US,
        },
        {
            provide: LocationStrategy,
            useClass: PathLocationStrategy
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MessageErrorInterceptor,
            multi: true
        },
        ThemeConstantService
    ],
    bootstrap: [AppComponent],
    // schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule { 

      constructor() {
    console.log('✅ AppModule cargado');
  }
}
