import { Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  signup(signupDto: SignUpDto) {
    /**
     * Check if user exist
     * if user exist throw error
     * else create user
     * retun user auth obj
     */
    return signupDto;
  }

  login(loginDto: LoginDto) {
    /**
     * Check if user exist
     * If user not exist throw error
     * If user exist => check password match
     * If Match => return userAuthObj;
     *      else throw error
     */
    return loginDto;
  }
}
