import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../i18n.service';
import { AuthService } from '../auth.service';
import { BakingSessionComponent } from '../baking-session/baking-session';
import { CompareComponent } from '../compare/compare';

@Component({
    selector: 'app-sessions',
    templateUrl: './sessions.html',
    styleUrl: './sessions.scss',
    imports: [BakingSessionComponent, CompareComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionsComponent {
    readonly i18n = inject(I18nService);
    readonly auth = inject(AuthService);
}
