import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BoardComponent } from './components/board/board.component';

export const routes: Routes = [
  {path: '', redirectTo: 'board', pathMatch: 'full'},
  { path: 'board', component: BoardComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: 'board' }
];