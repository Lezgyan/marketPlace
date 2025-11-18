package com.repository;

import com.dto.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public class UserDao {

    private final JdbcTemplate jdbc;

    public UserDao(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<User> findByUsername(String username) {
        String sql = "select u.id, u.username, u.password, u.email, u.enabled " +
                     "from users u where u.username = ?";
        List<User> users = jdbc.query(sql, new UserRowMapper(), username);
        if (users.isEmpty()) return Optional.empty();
        User user = users.get(0);
        user.setRoles(getRoles(user.getId()));
        return Optional.of(user);
    }

    public boolean existsByUsername(String username) {
        Integer count = jdbc.queryForObject(
                "select count(*) from users where username = ?",
                Integer.class,
                username
        );
        return count != null && count > 0;
    }

    public void save(User user) {
        String insertUser =
                "insert into users(username, password, email, enabled) " +
                "values (?, ?, ?, ?) returning id";
        Long id = jdbc.queryForObject(
                insertUser,
                Long.class,
                user.getUsername(),
                user.getPassword(),
                user.getEmail(),
                user.isEnabled()
        );
        user.setId(id);


        if (user.getRoles() != null) {
            for (String role : user.getRoles()) {
                jdbc.update(
                        "insert into user_roles(user_id, role) values(?, ?)",
                        user.getId(),
                        role
                );
            }
        }
    }

    private Set<String> getRoles(Long userId) {
        List<String> roles = jdbc.queryForList(
                "select role from user_roles where user_id = ?",
                String.class,
                userId
        );
        return new HashSet<>(roles);
    }

    private static class UserRowMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User user = new User();
            user.setId(rs.getLong("id"));
            user.setUsername(rs.getString("username"));
            user.setPassword(rs.getString("password"));
            user.setEmail(rs.getString("email"));
            user.setEnabled(rs.getBoolean("enabled"));
            return user;
        }
    }
}
